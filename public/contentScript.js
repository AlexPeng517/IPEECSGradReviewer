
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
       
        sendResponse(JSON.stringify(allCourses));
    }

    if(request.action === "fetchGeneralInfo"){
        let generalInfoData = document.getElementsByClassName("container")[0].getElementsByClassName("shadow-none p-3 m-2 bg-light rounded")[0];
        let generalInfoElements = generalInfoData.querySelectorAll("span");
        let generalInfo = {
            "studentID": generalInfoElements[3].innerText,
            "studentName": generalInfoElements[0].innerText,
        };
        console.log("generalInfo",generalInfo);
        sendResponse(JSON.stringify(generalInfo));

    }
});



