import { SkyScannerScrap } from './skyscanner.js';
import delay from 'delay';
import { createFlightsTable } from './sqlite.js'

await createFlightsTable();

while(true){
    await SkyScannerScrap();
    await delay(15*60*1000);
}