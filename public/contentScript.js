
// import { createRequire } from 'module'
// const require = createRequire(import.meta.url);

// const iconv = require('iconv-lite');
// let iconv;
console.log("contentScript.js is running");
// (async () => {
//     // eslint-disable-next-line no-undef
//     const src = chrome.runtime.getURL('iconvImport.js');
//     iconv = await import(src);
// })();

// function loadScript(url) {
//     const script = document.createElement('script');
//     script.src = chrome.runtime.getURL(url);
//     document.head.appendChild(script);
//   }
// const loadScriptAsync = async (url) => {
//     await import(chrome.runtime.getURL("./firebase-app.js"));
//     await import(chrome.runtime.getURL("./firebase-database.js"));}
// loadScriptAsync();


function parseHTMLTableElem(tableEl) {
    // console.log(tableEl);
    // const columns = Array.from(tableEl.querySelectorAll('th')).map(it => it.textContent)
    // console.log(columns);
    const rows = tableEl.querySelectorAll('tbody > tr')
    // console.log(rows);
    let courseList = [];
    for (let i = 2; i < rows.length-1; i++) {
        let course = {
            "courseID": "",
            "courseName": "",
            "courseType": "",
            "courseCredit": "",
            "courseGrade": "",
        };
        const cells = Array.from(rows[i].querySelectorAll('td'))
        course.courseID = cells[0].innerText;
        course.courseName = cells[2].innerText;
        course.courseType = cells[3].innerText;
        course.courseCredit = parseInt(cells[5].innerText);
        if (cells[6].innerText ==="勞動服務通過"){
            course.courseGrade = cells[6].innerText;
        }else{
            course.courseGrade = parseInt(cells[6].innerText);
        }
        courseList.push(course);
    }
    console.log(courseList);
    return courseList;
    // console.log(courseList);
    // return JSON.stringify(Array.from(rows).map(row => {
    //     const cells = Array.from(row.querySelectorAll('td'))
    //     return columns.reduce((obj, col, idx) => {
    //         obj[col] = cells[idx].textContent
    //         return obj;
    //     }, {})
    // }));
}






// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let gradeTablesContainer = document.getElementsByClassName("container");
    let gradeTablesBySemester = gradeTablesContainer[1].getElementsByTagName("table");
    let allCourses = {
        "courseList": [],
    };
    console.log(gradeTablesContainer);
    console.log("printing gradeTablesBySemester");
    console.log(gradeTablesBySemester);
    // console.log(parseHTMLTableElem(gradeTablesBySemester[0]));
    for (let i = 0; i < gradeTablesBySemester.length; i++) {
        allCourses.courseList = allCourses.courseList.concat(parseHTMLTableElem(gradeTablesBySemester[i]));
    }
    console.log(allCourses.courseList.length);
    console.log(JSON.stringify(allCourses));



    if(request.action === "fetchGradeTable"){
        //TODO: Use iteration to convert all elements in doc to JSON and send back via sendResponse
        sendResponse(JSON.stringify(allCourses));
    }

    // function callback(cookies) {
    //     let cookieHeader = "";
    //     console.log(cookies);
    //     if (cookies.length === 0) {
    //         console.log("An error occurred when fetching grade table.");
    //     }
    //     cookieHeader += `${cookies[0].name}=${cookies[0].value}; `;
    //     console.log(cookieHeader);
    //     let url = "https://cis.ncu.edu.tw/iNCU/academic/register/transcriptQuery";
    //     const headers = new Headers();
    //     headers.append("Cookie", cookieHeader);

    //     const reqParams = {
    //         method: "GET",
    //         headers: headers,
    //         mode: "cors",
    //         cache: "default",
    //     };

    //     const getHtmlAsync = async (url, reqParams) => {
    //         console.log("Getting students grade records");
    //         let htmlString = await fetch(url, reqParams)
    //         .then(function (response) {
    //             console.log(response);
    //             // return response.arrayBuffer();
    //             return response;
    //         })
    //         // .then(function (buf) {
    //         //     console.log("decode big5");
    //         //     const decoder = new TextDecoder("big5");
    //         //     return decoder.decode(buf);
    //         // })
    //         .catch((error) => {
    //             console.log(error);
    //         });
    
    //         let parser = new DOMParser();
    //         let parsed = parser.parseFromString(htmlString, "text/html");
    //         return parsed;
    //     };
    //     getHtmlAsync(url, reqParams).then((parsed) => {
    //         console.log("Sending response from contentScript.js");
    //         console.log(parsed);
    //         sendResponse(parsed);
    //     });
    // }
    // 
    // if(request.action === "fetchGradeTable"){
    //     console.log("received request from extesion, printing cookies");
    //     console.log(request.cookies);
    //     let cookieHeader = "";
    //     if (request.cookies.length === 0) {
    //         console.log("An error occurred when fetching grade table.");
    //     }
    //     cookieHeader += `${request.cookies[0].name}=${request.cookies[0].value}; `;
    //     console.log(cookieHeader);
    //     let url = "https://cis.ncu.edu.tw/iNCU/academic/register/transcriptQuery";
    //     const headers = new Headers();
    //     headers.append("Cookie", cookieHeader);

    //     const reqParams = {
    //         method: "GET",
    //         headers: headers,
    //         mode: "cors",
    //         cache: "default",
    //     };

    //     const getHtmlAsync = async (url, reqParams) => {
    //         console.log("Getting students grade records");
    //         let htmlString = await fetch(url, reqParams)
    //             .then(function (response) {
    //                 console.log(response);
    //                 return response;}).catch((error) => {
    //                     console.log(error);
    //                 });
                
    //             return htmlString;
    //         };
    //     let htmlResponse = getHtmlAsync(url, reqParams);
    //     console.log("Sending response from contentScript.js");
    //     console.log("sent resonse");
    //     console.log(htmlResponse);
        // eslint-disable-next-line no-undef
        // chrome.cookies.getAll({ url: "https://portal.ncu.edu.tw" }, callback);
        // callback(request.cookies);
    // }
});



