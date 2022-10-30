import React from "react";
import GradReviewer from "./GradReviewer";
import axios from "axios";
import { CheckTableContext } from "./FetchGradeTable";
import Form from 'react-bootstrap/Form';

const apiUrls = {
  108: "https://script.google.com/macros/s/AKfycbwfymU6hEPR8cTMgQcrnLfGe_aH_GV1AZX2SJ3K7_piJ1MgplJ50-tWPAp9lvPERizi5g/exec",
  109: "https://script.google.com/macros/s/AKfycby9M-00Qq2Ug3kqmnc2zjnSSjmYvBdWPClhCXzM00aESvt9T_Yyf3aAXlTgToRwBFcb/exec",
  110: "https://script.google.com/macros/s/AKfycbwifwTJYcSEHwjR6iPuvI9gcqWDCx8FpfQDcNpd6EFaf77w1LQAuejpWHl3AxCY5Fc4Dg/exec",
  111: "https://script.google.com/macros/s/AKfycbw9bA2u0QC-W8hxDxCMye3bvrjICNdkO8JXBoTeA7u4O8ve8l7dgyUm6X51XpWPibK_7w/exec",
};
let rules: never[] = [];
// let ruleTag = [
//   "創意與創業學分學程",
//   "校訂必修",
//   "院訂必修",
//   "院訂必選",
//   "英文必選",
//   "網路專長",
//   "資工專長",
//   "電機專長",
//   "電機專長-實驗群組",
//   "電機專長-記號課程",
//   "通訊專長",
// ];

function SelectGradReviewRule() {
  const checkTable = React.useContext(CheckTableContext);
  console.log("checkTable from select component", checkTable);
  const [ruleYear, setRuleYear] = React.useState("-- select an year -- ");
  const [ruleFetchingState, setRuleFetchingState] =
    React.useState("Please select a year to get rules");
  const handleChange = (e: any) => {
    setRuleFetchingState("Fetching rules in progress...");
    setRuleYear(e.target.value);
    //fetch api to update rule
    const selectedRuleYear = e.target.value as number;
    console.log(apiUrls[selectedRuleYear as keyof typeof apiUrls]);
    axios
      .get(apiUrls[selectedRuleYear as keyof typeof apiUrls])
      .then((res) => {
        rules = res.data;
        setRuleFetchingState("Rules are up to date");
        console.log(rules);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  return (
    <div>
      <Form.Select value={ruleYear}
        onChange={handleChange}
        disabled={ruleFetchingState === "Fetching rules in progress..."} 
        aria-label="Default select example">
      <option hidden selected>
          {" "}
          -- select an option --{" "}
        </option>
        <option value="108">108</option>
        <option value="109">109</option>
        <option value="110">110</option>
        <option value="111">111</option>
      </Form.Select>
      <p>{ruleFetchingState}</p>
      {ruleFetchingState === "Rules are up to date" && (
         <p>You have selected {ruleYear} !</p>
      )}
      {ruleFetchingState === "Rules are up to date" && (
        <GradReviewer rule={rules} />
      )}
     
    </div>
  );
}

export default SelectGradReviewRule;
