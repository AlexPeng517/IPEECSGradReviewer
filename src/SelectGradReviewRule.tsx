import React from "react";
import GradReviewer from "./GradReviewer";

import Form from 'react-bootstrap/Form';

export const RulesContext = React.createContext({});
export const RulesContextProvider = RulesContext.Provider;



function SelectGradReviewRule() {
  const [ruleYear, setRuleYear] = React.useState("-- select an year -- ");
  const [ruleFetchingState, setRuleFetchingState] = React.useState("Please select a year to get rules");
  const [rules, setRules] = React.useState(null);

  const handleChange = async (e: any) => {
    setRuleFetchingState("Fetching rules in progress...");
    setRuleYear(e.target.value);
   
    const selectedRuleYear = e.target.value as number;
    
    try {
      const fetchedRules:any = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "fetchGradeReviewRule", ruleYear: selectedRuleYear }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      setRules(fetchedRules);
      setRuleFetchingState("Rules are up to date");
    } catch (error) {
      console.error("Error fetching rules:", error);
      setRuleFetchingState("Error fetching rules");
    }
    

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

      {rules !== null && (
        <RulesContextProvider value={{ rules }}>
          <GradReviewer />
        </RulesContextProvider>)}
      
     
    </div>
  );
}

export default SelectGradReviewRule;
