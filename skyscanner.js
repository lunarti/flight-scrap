import puppeteer from 'puppeteer';
import delay from 'delay';
import { Pushover } from 'pushover-js';
import { insertFlight, getAverageTotalCostForDepartures } from './sqlite.js';
import 'dotenv/config'

const pushover = new Pushover(process.env.USER_KEY_PUSHOVER, process.env.API_KEY_PUSHOVER);
pushover.setDevice(process.env.DEVICE_NAME);

async function getElementTextContent(page, className) {
  const textContent = await page.evaluate((className) => {
    const element = document.querySelector(className);
    if (element) {
      return element.textContent;
    } else {
      return null;
    }
  }, className);
  return textContent;
}

const SkyScannerScrap = async () => {
      const pages_to_scrap = [
        { title: 'GRU/GYN', url: 'https://www.skyscanner.com.br/transporte/passagens-aereas/gru/gyn/240524/240526/?adultsv2=2&cabinclass=economy&childrenv2=&inboundaltsenabled=false&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1' },
        { title: 'GRU/GYN', url: 'https://www.skyscanner.com.br/transporte/passagens-aereas/gru/gyn/240524/240527/?adultsv2=2&cabinclass=economy&childrenv2=&inboundaltsenabled=false&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1' },
        { title: 'GRU/BSB', url: 'https://www.skyscanner.com.br/transporte/passagens-aereas/gru/bsb/240614/240616/?adultsv2=2&cabinclass=economy&childrenv2=&inboundaltsenabled=false&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1' },
        { title: 'GRU/BSB', url: 'https://www.skyscanner.com.br/transporte/passagens-aereas/gru/bsb/240614/240617/?adultsv2=2&cabinclass=economy&childrenv2=&inboundaltsenabled=false&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1' }
      ];

      for (const sel_page of pages_to_scrap) {
        try {
          console.log("Scraping:", sel_page.title);
          const browser = await puppeteer.launch({
            headless: true, // Set headless mode to true
            defaultViewport: { width: 1920, height: 1080 }, // Set viewport size
            args: ['--window-size=1920,1080'] // Set window size
          });
          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');

          await page.goto(sel_page.url, { waitUntil: 'domcontentloaded' });
          await page.waitForNetworkIdle()
          await delay(15000);
          const text = await getElementTextContent(page, '.EcoTicketWrapper_itineraryContainer__ZWE4O');
          const regex = /Opção de voo \d+: R\$ (\d+) por passageiro\. Custo total R\$ (\d+)\.Voo de ida com (.+)\.Partindo de (.+) às (\d{2}:\d{2}), chegando em (.+) às (\d{2}:\d{2})\.Voo direto levando (\d+) hora(?:s?) e (\d+) minutos\.Voo de volta com (.+)\.Partindo de (.+) às (\d{2}:\d{2}), chegando em (.+) às (\d{2}:\d{2})\.Voo direto levando (\d+) hora(?:s?) e (\d+) minutos\.Preço inclui impostos e taxas\./;
          // Extract information using the regular expression
          const match = regex.exec(text);
          if (match) {
            const [, idaPrice, totalCost, idaAirline, idaDepartureAirport, idaDepartureTime, idaArrivalAirport, idaArrivalTime, idaDurationHours, idaDurationMinutes, voltaAirline, voltaDepartureAirport, voltaDepartureTime, voltaArrivalAirport, voltaArrivalTime, voltaDurationHours, voltaDurationMinutes] = match;

            // Format the extracted information
            const formattedInfo = {
              pricePerPassenger: idaPrice,
              totalCost: totalCost,
              outboundAirline: idaAirline,
              outboundDepartureAirport: idaDepartureAirport,
              outboundDepartureTime: idaDepartureTime,
              outboundArrivalAirport: idaArrivalAirport,
              outboundArrivalTime: idaArrivalTime,
              outboundDuration: `${idaDurationHours}h ${idaDurationMinutes}m`,
              returnAirline: voltaAirline,
              returnDepartureAirport: voltaDepartureAirport,
              returnDepartureTime: voltaDepartureTime,
              returnArrivalAirport: voltaArrivalAirport,
              returnArrivalTime: voltaArrivalTime,
              returnDuration: `${voltaDurationHours}h ${voltaDurationMinutes}m`
            };

            insertFlight(formattedInfo)
            .then((result) => {
              console.log(`Flight inserted with ID: ${result.id}`);
            })
            .catch((error) => {
              console.error('Error:', error);
            });

            const avgTotalCost = await getAverageTotalCostForDepartures(idaDepartureAirport, voltaDepartureAirport);

            if (avgTotalCost && parseInt(totalCost) < parseInt(avgTotalCost)) {
              await pushover
                .setUrl(sel_page.url, 'Link Skyscanner')
                .send(sel_page.title, JSON.stringify(formattedInfo, null, 2));
            }
  
          } else { console.log("Failed scrap") }
          
          await browser.close();
          await delay(60000); // delay for skyscanner
          
        } catch (error) {
        console.error('Error:', error);
        }
      }
}

export { SkyScannerScrap }
