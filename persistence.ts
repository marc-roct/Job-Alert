import fs from 'fs';
import { Job } from './main';

export function storeData(company, data) {
  let path = "./cachedJobs/"+company+".txt";
  var myJsonString = JSON.stringify(data);
  fs.writeFileSync(path, myJsonString, 'utf-8');
}


export function readData(company): Job[] {
  let path = "./cachedJobs/"+company+".txt";
  if (!fs.existsSync(path)) {
    return [];
  }
  let data = fs.readFileSync(path, 'utf-8')
  return JSON.parse(data)
}