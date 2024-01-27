import React from "react";
import { CheckTableContext } from "./FetchGradeTable";
import { RulesContext } from "./SelectGradReviewRule";
import Button from "react-bootstrap/Button";

interface Course {
  courseID: string;
  courseName: string;
  courseType: string;
  courseCredit: number;
  courseGrade: number;
}

interface Rule {
  ruleKeywords: string[];
  ruleCredit: number;
}

function reviewCommonRequired(courseList: Course[], rules: any) {
  let isChinesePassed = false;
  let isEnglishPassed = false;
  let isPEPassed = false;
  let isGeneralEducationPassed = false;
  let isCommonRequiredPassed = false;

  // 1. Chinese
  const chineseRule: Rule = {
    ruleKeywords: rules["chinese"].courseKeywords,
    ruleCredit: rules["chinese"].creditRequirement,
  };

  const chineseCourses = courseList.filter((course) => {
    return chineseRule.ruleKeywords
      .map((keyword) => new RegExp(keyword))
      .some((regex) => regex.test(course.courseID));
  });
  console.log("checked chinese courses", chineseCourses);
  let chineseCredits = chineseCourses.reduce(
    (sum, course) => sum + course.courseCredit,
    0
  );
  if (chineseCredits >= chineseRule.ruleCredit) {
    isChinesePassed = true;
  }
  console.log("chineseCredits", chineseCredits);
  console.log("isChinesePassed", isChinesePassed);

  // 2. English
  const englishRule: Rule = {
    ruleKeywords: rules["english"].courseKeywords,
    ruleCredit: rules["english"].creditRequirement,
  };

  const englishCourses = courseList.filter((course) => {
    return englishRule.ruleKeywords
      .map((keyword) => new RegExp(keyword))
      .some((regex) => regex.test(course.courseID));
  });
  console.log("checked english courses", englishCourses);

  let englishCredits = englishCourses.reduce(
    (sum, course) => sum + course.courseCredit,
    0
  );
  if (englishCredits >= englishRule.ruleCredit) {
    isEnglishPassed = true;
  }
  console.log("englishCredits", englishCredits);
  console.log("isEnglishPassed", isEnglishPassed);

  // 3. PE
  const PERule: Rule = {
    ruleKeywords: rules["PE"].courseKeywords,
    ruleCredit: rules["PE"].creditRequirement,
  };
  const PECourses = courseList.filter((course) => {
    return PERule.ruleKeywords
      .map((keyword) => new RegExp(keyword))
      .some((regex) => regex.test(course.courseID));
  });
  console.log("checked PE courses", PECourses);
  if (PECourses.length >= 5) {
    isPEPassed = true;
  }
  console.log("isPEPassed", isPEPassed);
  // 4. General Education
  const generalEducationRule: Rule = {
    ruleKeywords: rules["generalEducation"].courseKeywords,
    ruleCredit: rules["generalEducation"].creditRequirement,
  };
  const generalEducationCourses = courseList.filter((course) => {
    return generalEducationRule.ruleKeywords
      .map((keyword) => new RegExp(keyword))
      .some((regex) => regex.test(course.courseID));
  });
  console.log("checked general education courses", generalEducationCourses);

  let generalEducationCredits = generalEducationCourses.reduce(
    (sum, course) => sum + course.courseCredit,
    0
  );
  if (generalEducationCredits >= generalEducationRule.ruleCredit) {
    isGeneralEducationPassed = true;
  }
  console.log("GeneralEducationCredits", generalEducationCredits);
  console.log("isGeneralEducationPassed", isGeneralEducationPassed);
}

function reviewAll(checkTable: [], rules: { [key: string]: any }) {
  let result: any = [];
  return result;
}

function GradReviewer() {
  const checkTableData: any = React.useContext(CheckTableContext);
  const rulesData: any = React.useContext(RulesContext);
  const rules = rulesData.rules;
  const courseList: Course[] = checkTableData.checkTable.map(
    (checkTable: any) => ({
      courseID: checkTable.courseID,
      courseName: checkTable.courseName,
      courseType: checkTable.courseType,
      courseCredit: checkTable.courseCredit,
      courseGrade: checkTable.courseGrade,
    })
  );

  console.log("courses from type mapping", courseList);
  console.log("rules received by grad reviewer", rules.commonRequired);

  reviewCommonRequired(courseList, rules.commonRequired);

  const [HTMLFileGenerateState, setHTMLFileGenerateState] =
    React.useState("generate HTML file");
  const handleClick = () => {
    // console.log("checkTable: ", checkTable);
    // validation(checkTable, rules);
    setHTMLFileGenerateState("done");
  };
  // download HTML file
  const downloadClick = (e: any) => {
    // console.log(e.target);
    console.log("download file");
    // e.target.href =
    //   "data:text/html;charset=UTF-8," + encodeURIComponent(createHTMLFile());
    setHTMLFileGenerateState("reset to default");
  };

  return (
    <div>
      <Button variant="primary" onClick={handleClick}>
        Check
      </Button>{" "}
      <a
        className="App-download"
        id="download"
        onClick={downloadClick}
        href="#download"
        download="validate.html"
        style={HTMLFileGenerateState === "done" ? {} : { display: "none" }}
      >
        Download Result
      </a>
    </div>
  );
}

export default GradReviewer;
