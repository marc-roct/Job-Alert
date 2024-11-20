require('dotenv').config()
import fetch from 'node-fetch';
import {parse} from 'parse5';
import { readData, storeData } from './persistence';
import { sendMail } from './mail';
import { error } from 'console';
import { rejects } from 'assert';

const webScrapeList = [{name :"Walmart", func: fetchJsonWalmart()},
  {name :"McDonalds", func: fetchJsonMcDonalds()},
  {name :"Subways", func: fetchJsonSubway()}
]

export interface Job {
  link: string,
  title: string,
  location: string,
}

async function main() {
  let jobsToMail: Job[] = [];
  for (let website of webScrapeList) {
    let newJobs: Job[] = [];
    let listJobs: Job[] = await website['func'];
    
    let storedJobs: Job[] = readData(website.name);
    for (let ljob of listJobs) {
      if (!containsJob(storedJobs, ljob)) {
        newJobs.push(ljob)
      }
    }
    // console.log(storedJobs)
    listJobs = newJobs.concat(storedJobs)
    while (listJobs.length > 50) {
      listJobs.pop();
    }
    storeData(website.name, newJobs);
    jobsToMail = jobsToMail.concat(newJobs)

  }
  if (jobsToMail.length > 0) {
    sendMail(jobsToMail);
  }
}



// Helper function to scrape specific html elements from a fetch'd html page
function queryNode(node, component:string, query: string): any {
  if (Object.keys(node).includes("attrs")) {
    for (let attribute of node.attrs) {
      if (attribute.name == component) {
        if (attribute.value == query) return node;
      }
    }
  }
	if (Object.keys(node).includes("childNodes")) {
		for (let child of node.childNodes) {
      let result = queryNode(child, component, query);
      if (result) return result;
		}
	}
	return null;
}


async function fetchJsonWalmart() : Promise<Job[]> {
  let baseUrl: string = 'https://careers.walmart.ca/';
  return fetch('https://careers.walmart.ca/search-jobs/Surrey%2C%20British%20Columbia/4853/4/6251999-5909050-5965814-12031872-6159905/49x10635/-122x82509/25/2', { redirect: 'manual' })
  .then((response) => response.text())
  .then((text) => {
    const document = parse(text);
    let listJobs: Job[] = [];
    let jobs = queryNode(document.childNodes[1].childNodes[2], "id", "search-results-list").childNodes[1];
    for (let child of jobs.childNodes) {
      var tempJob = <Job>{};
      if (child.nodeName == 'li') {
        for (let a of child.childNodes) {
          if (a.nodeName == 'a') {
            for (let attribute of a.attrs) {
              if (attribute.name == 'href') {
                tempJob.link = baseUrl + attribute.value;
              }
            }
            
            tempJob.title = a.childNodes[1].childNodes[0].value;
            tempJob.location = a.childNodes[3].childNodes[0].value + " " + a.childNodes[5].childNodes[0].value;
            listJobs.push(tempJob);
          }
        }
      }
    }
    return Promise.resolve(listJobs);
  });
}

async function fetchJsonMcDonalds(): Promise<Job[]> {
  let baseUrl: string = 'https://careers.mcdonalds.ca'; 
  return fetch('https://careers.mcdonalds.ca/jobs?page_size=10&page_number=1&location=1-3956&radius=10&locationDescription=City&locationName=Surrey%2C%20BC&sort_by=start_date&sort_order=DESC&country=CA&distance_units=km', { redirect: 'manual' })
  .then((response) => response.text())
  .then((text) => {
      const document = parse(text);
      let listJobs: Job[] = [];
      let jobs = queryNode(document, "class", "results-list front");
  
      for (let child of jobs.childNodes) {
        var tempJob = <Job>{};
        tempJob.link = baseUrl + queryNode(child, "class", "results-list__item-title").attrs[1].value;
        tempJob.title = queryNode(child, "class", "results-list__item-title").childNodes[0].childNodes[0].value;
        tempJob.location = queryNode(child, "class", "results-list__item-street--label").childNodes[1].value;
        listJobs.push(tempJob)
      }
      return Promise.resolve(listJobs);
  }).catch((error) => {
    return Promise.reject(error);
  })
}

async function fetchJsonSubway(): Promise<Job[]> {
  return fetch('https://harri.com/mysubwaycareer?filters=postalCode%253DV4N%2525202H4%2526postalCodeRadius%253D100', { redirect: 'manual' })
  .then((response) => response.text())
  .then((text) => {
      const document = parse(text);
      let listJobs: Job[] = [];
      // let jobs = queryNode(document, "class", "results-list front");
  
      // for (let child of jobs.childNodes) {
      //   var tempJob = <Job>{};
      //   tempJob.link = baseUrl + queryNode(child, "class", "results-list__item-title").attrs[1].value;
      //   tempJob.title = queryNode(child, "class", "results-list__item-title").childNodes[0].childNodes[0].value;
      //   tempJob.location = queryNode(child, "class", "results-list__item-street--label").childNodes[1].value;
      //   listJobs.push(tempJob)
      // }
      return Promise.resolve(listJobs);
  }).catch((error) => {
    return Promise.reject(error);
  })
}

function containsJob(storedJobs, ljob): boolean {
  for (let sjob of storedJobs) {
    if (sjob.link == ljob.link) {
      return true;
    }
  }
  return false
}


await main();