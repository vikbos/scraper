const puppeteer = require('puppeteer')
const R = require('ramda')

const { map, equals } = R

const linkMatches = (dataSet) => (dataSetItem) => {
    const { matchName, matchRates } = dataSetItem
    const findEquivalentMatch = dataSet.find(data => equals(data.matchName, matchName))
    if (findEquivalentMatch) {
        const { matchRates: matchRates2 } = findEquivalentMatch
        return {
            matchName,
            firstCalculation: [Number(matchRates2[0]), Number(matchRates[1])],
            secondCalculation: [Number(matchRates2[1]), Number(matchRates[0])],
        }
    }
}

const calculateSurebet = (data) => {
    const { matchName, firstCalculation, secondCalculation } = data
    const [fNum1, fNum2] = firstCalculation.map(num => num - 1)
    const resultFirstCalc = fNum1.toFixed(2) * fNum2.toFixed(2)
    const [sNum1, sNum2] = secondCalculation.map(num => num - 1)
    const resultSecondCalc = sNum1.toFixed(2) * sNum2.toFixed(2)
    return {
        matchName,
        firstCalc: resultFirstCalc.toFixed(2),
        secondCalc: resultSecondCalc.toFixed(2),
    }
}

const scrapeDataFrom = async(url) => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })

    // evaluate can be used only with await page.goto(url, { waitUntil: 'networkidle2' })
    const scrapeTipsportData = await page.evaluate(() => {
        const matchRows = document.querySelectorAll('div.o-matchRow')
        const formatedData = Array.from(matchRows, matchRow => {
            const matchName = matchRow.querySelector('span.o-matchRow__matchName').innerText
            const formatedMatchName = matchName.split('-').map(str => {
                return str.trim().split(' ').slice(0, 1).join()
            })
            const rates = matchRow.querySelectorAll('div.btnRate')
            const btnRates = Array.from(rates, rate => rate.innerText)

            return {
                matchName: formatedMatchName,
                matchRates: btnRates
            }
        })
        return formatedData
    })
    console.log('tipsort scraped')
    browser.close()
    return scrapeTipsportData
}

scrapeDataFrom('https://www.tipsport.cz/kurzy/stolni-tenis-40')
.then(async(tipsportData) => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('https://www.ifortuna.cz/sazeni/stolni-tenis#/', { waitUntil: 'networkidle2' })

    const scrapeIFortunaData = await page.evaluate(() => {
        const matchRows = document.querySelectorAll('td.col-title')
        const formatedData = Array.from(matchRows, matchRow => {
            const matchName = matchRow.querySelector('span.market-name').innerText
            const formatedMatchName = matchName.split('-').map(str => {
                return str.trim().split(' ').slice(0, 1).join()
            })
            const tr = matchRow.parentNode
            const rates = tr.querySelectorAll('span.odds-value')
            const btnRates = Array.from(rates, rate => rate.innerText)

            return {
                matchName: formatedMatchName,
                matchRates: btnRates
            }
        })
        return formatedData
    })
    //link matches
    const linkedMatches = map(linkMatches(tipsportData), scrapeIFortunaData).filter(item => item)
    console.log('TCL: linkedMatches', linkedMatches)
    console.log('TCL: calculatedBets', map(calculateSurebet, linkedMatches))
    console.log('ifortuna scraped')
    browser.close()
    // return some data
})
.then(async() => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('https://sport.synottip.cz/Odds.aspx?i=16170&v=0&fo=False', { waitUntil: 'networkidle2' })

    const scrapeSynotData = await page.evaluate(() => {
        const matchRows = document.querySelectorAll('tr.row')
        console.log('TCL: matchRows', matchRows)
        const formatedData = Array.from(matchRows, matchRow => {
            const matchName = matchRow.querySelector('td.match').innerText
            const formatedMatchName = matchName.split('-').map(str => {
                return str.replace(',', '').trim().split(' ').slice(0, 1).join()
            })
            const rates = matchRow.querySelectorAll('td.rate')
            const btnRates = Array.from(rates, rate => rate.innerText)

            return {
                matchName: formatedMatchName,
                matchRates: btnRates
            }
        })
        return formatedData
    })
    // vypocitat vsechny scrapenute data
})
// helpers.test()