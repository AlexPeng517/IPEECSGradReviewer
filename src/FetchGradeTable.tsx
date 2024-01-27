import React, { useEffect } from "react";
// import { Buffer } from "buffer";
import SelectGradReviewRule from "./SelectGradReviewRule";

export const CheckTableContext = React.createContext({});
export const CheckTableContextProvider = CheckTableContext.Provider;

// const iconv = require("iconv-lite");

let checkTable:any = async () => {
  let allCourses:any
  const [tab]:any = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  console.log("tab id: "+tab.id);
  allCourses = await chrome.tabs.sendMessage(tab.id, {action: "fetchGradeTable"});
  allCourses = JSON.parse(allCourses);
  console.log("response received by extension: ");
  console.log(allCourses);
  allCourses = allCourses.courseList.filter((entry: any) => {
    if ((entry.courseGrade >= 60 || entry.courseGrade === "勞動服務通過") && entry.courseGrade !== "停修" && entry.courseCredit !== null) {
      return true;
    }
    return false;
  });
  return allCourses;
};

function FetchGradeTable() {
  const [fetchingState, setfetchingState] = React.useState(
    "fetching course table..."
  );
  useEffect(() => {
    console.log("get cookies");
    console.log("use effect");
    (async () =>{
      await console.log("checkTable", checkTable());
      checkTable = await checkTable();
      await setfetchingState("Course Table Fetched Successfully");
    })();
    
    
  }, []);

  
  
  return (
    <div>
      <h1>{fetchingState}</h1>
      {fetchingState === "An error occurred when fetching grade table." && (
        <a
          className="App-link"
          href="https://portal.ncu.edu.tw/system/162"
          target="_blank"
          rel="noopener noreferrer"
        >
          Please Login to NCU Portal Prior to Fetch Your Grade Data
        </a>
      )}
      <CheckTableContextProvider value={{ checkTable }}>
        {fetchingState === "Course Table Fetched Successfully" && <SelectGradReviewRule />}
      </CheckTableContextProvider>
    </div>
  );
}
export default FetchGradeTable;
