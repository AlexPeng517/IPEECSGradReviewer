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

    const reqParams : RequestInit = {
        method: "GET",
        headers: headers,
        mode: "cors",
        cache: "default"
    };
    const getHtmlAsync = async (url:string,reqParams:RequestInit) => {
      console.log("Getting students grade records");
      let response = await fetch(url,reqParams);
      let htmlString = await response.text();
      let parser = new DOMParser();
      let parsed = parser.parseFromString(htmlString, "text/html");
      return parsed;
    };
    getHtmlAsync(url,reqParams).then((parsed) => {
      gradeTable = parsed.getElementsByTagName("table")[0].children[0];
      console.log(gradeTable);
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