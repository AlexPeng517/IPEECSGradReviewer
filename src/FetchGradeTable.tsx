import React, { useEffect } from "react";

function FetchGradeTable() {
  const [fetchingState, setfetchingState] = React.useState("fetching");
  useEffect(() => {
    chrome.cookies.getAll({ url: "https://cis.ncu.edu.tw" }, callback);
    console.log("get cookies");
  }, []);

  const callback = (
    cookies: {
      name: string;
      value: string;
    }[]
  ) => {
    let cookieHeader = "";
    let gradeTable = null;
    console.log(cookies);
    cookieHeader += `${cookies[0].name}=${cookies[0].value}; `;
    console.log(cookieHeader);
    let url =
      "https://cis.ncu.edu.tw/ScoreInquiries/student/student_record.php";
    const headers = new Headers();
    headers.append("Cookie", cookieHeader);

    const reqParams: RequestInit = {
      method: "GET",
      headers: headers,
      mode: "cors",
      cache: "default",
    };
    const getHtmlAsync = async (url: string, reqParams: RequestInit) => {
      console.log("Getting students grade records");
      let response = await fetch(url, reqParams);
      let htmlString = await response.text();
      let parser = new DOMParser();
      let parsed = parser.parseFromString(htmlString, "text/html");
      return parsed;
    };
    getHtmlAsync(url, reqParams).then((parsed) => {
      gradeTable = parsed.querySelectorAll(".list1");

      // get all course data, and get rid of 操行
      let newTable = Array.from(gradeTable)
        .map((element) => {
          return Array.from(element.childNodes).map(
            (childNode) => childNode.textContent
          );
        })
        .filter((course) => course[3]);

      // 將課號抓出來，寫好爛 QAQ
      newTable.forEach((course) => {
        if (course[2]) {
          let matchNum = course[2].match(/[A-Z]{2,2}[0-9]{4,4}/);
          course[2] = matchNum ? matchNum[0] : null;
        }
      });

      // 去除重複課號
      const flags = new Set();
      newTable = newTable.filter((course) => {
        if (flags.has(course[2])) {
          return false;
        }
        flags.add(course[2]);
        return true;
      });
      // 會多一個怪怪的東西
      console.log(newTable);

      // console.log(gradeTable);
      setfetchingState("done");
    });
  };
  return (
    <div>
      <h1>{fetchingState}</h1>
    </div>
  );
}
export default FetchGradeTable;
