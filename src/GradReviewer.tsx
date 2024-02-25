import React from "react";
import { CheckTableContext } from "./FetchGradeTable";
import { RulesContext } from "./SelectGradReviewRule";
import Button from "react-bootstrap/Button";
import { renderToString } from "react-dom/server";
import "bootstrap/dist/css/bootstrap.min.css";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

interface Course {
  courseID: string;
  courseName: string;
  courseType: string;
  courseCredit: number;
  courseGrade: number;
}

interface Rule {
  courseKeywords: string[];
  creditRequirement: number;
}

type IsPassedFlagsDict = {
  [key: string]: boolean;
};

type CriteriaPassedCoursesDict = {
  [key: string]: Course[];
};

type ResultDict = {
  [key: string]:
    | {
        isPassed: boolean;
        criteriaPassedCourses: Course[];
      }
    | {
        [key: string]: {
          isPassed: boolean;
          criteriaPassedCourses: Course[];
        };
      }
    | boolean;
};

function reviewCommonRequired(
  courseList: Course[],
  rules: { [key: string]: Rule }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  let residualCredits = 0;
  for (const requiredCourse in rules) {
    // PE is a special case, it only requires 5 courses instead of a specific amount of credits
    if (requiredCourse === "PE") {
      const ruleKeywords = rules[requiredCourse].courseKeywords;
      const recognizedCourses = courseList.filter((course) => {
        return ruleKeywords
          .map((keyword: string) => new RegExp(keyword))
          .some((regex: RegExp) => regex.test(course.courseID));
      });

      criteriaPassedCourses[requiredCourse] = recognizedCourses;

      if (recognizedCourses.length >= 5) {
        isPassedFlags[requiredCourse] = true;
      } else {
        isPassedFlags[requiredCourse] = false;
      }

      result[requiredCourse] = {
        isPassed: isPassedFlags[requiredCourse],
        criteriaPassedCourses: criteriaPassedCourses[requiredCourse],
      };
      continue;
    }
    const ruleKeywords = rules[requiredCourse].courseKeywords;
    const ruleCredit = rules[requiredCourse].creditRequirement;
    let recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    if (recognizedCourses.length === 0) {
      isPassedFlags[requiredCourse] = false;
      continue;
    }

    criteriaPassedCourses[requiredCourse] = recognizedCourses;

    let recognizedCredits = recognizedCourses.reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );
    if (recognizedCredits >= ruleCredit) {
      isPassedFlags[requiredCourse] = true;
      // General Education is a special case, the exceeded credits will be counted as general elective credits
      if (requiredCourse === "generalEducation") {
        residualCredits = recognizedCredits - ruleCredit;
      }
    } else {
      isPassedFlags[requiredCourse] = false;
    }
    result[requiredCourse] = {
      isPassed: isPassedFlags[requiredCourse],
      criteriaPassedCourses: criteriaPassedCourses[requiredCourse],
    };
  }
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  console.log("passFlags", isPassedFlags);
  console.log("residualCredits", residualCredits);
  console.log("criteriaPassedCourses", criteriaPassedCourses);
  console.log("result", result);
  return result;
}

function reviewCreativityAndEntrepreneurship(
  courseList: Course[],
  rules: { [key: string]: { [key: string]: Rule } | any }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let totalPassedCourses: CriteriaPassedCoursesDict = {};
  let totalCreditRequirement: number = rules["creditRequirement"];
  let totalRecognizedCredits: number = 0;
  let isRequiredPassed: boolean = false;

  //check if the required courses are passed
  let requiredCoursesKeywords = rules["required"]["courseKeywords"];
  let recognizedRequiredCourses = courseList.filter((course) => {
    return requiredCoursesKeywords
      .map((keyword: string) => new RegExp(keyword))
      .some((regex: RegExp) => regex.test(course.courseID));
  });
  let recognizedRequiredCredits = recognizedRequiredCourses.reduce(
    (sum, course) => sum + course.courseCredit,
    0
  );
  if (recognizedRequiredCredits >= rules["required"].creditRequirement) {
    isRequiredPassed = true;
  } else {
    isRequiredPassed = false;
  }

  for (const criteria in rules) {
    if (criteria === "creditRequirement" || criteria === "required") continue;

    let criteriaRcognizedCredits: number = 0;
    let ruleCredit: number = rules[criteria].creditRequirement;
    let criteriaPassedCourses: Course[] = [];

    for (const item in rules[criteria]) {
      if (item === "creditRequirement") continue;

      let ruleKeywords = rules[criteria][item].courseKeywords;
      let recognizedCourses = courseList.filter((course) => {
        return ruleKeywords
          .map((keyword: string) => new RegExp(keyword))
          .some((regex: RegExp) => regex.test(course.courseID));
      });

      // If there are multiple equivalent courses, only the one with the highest credit is counted
      if (criteria === "creativityFoundation" && recognizedCourses.length > 1) {
        recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
        recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
      }
      criteriaPassedCourses = criteriaPassedCourses.concat(recognizedCourses);
    }
    criteriaRcognizedCredits = criteriaPassedCourses.reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );

    totalRecognizedCredits += criteriaRcognizedCredits;
    totalPassedCourses[criteria] = criteriaPassedCourses;
    if (criteriaRcognizedCredits >= ruleCredit) {
      isPassedFlags[criteria] = true;
    } else {
      isPassedFlags[criteria] = false;
    }

    result[criteria] = {
      isPassed: isPassedFlags[criteria],
      criteriaPassedCourses: totalPassedCourses[criteria],
    };
  }
  
  if (totalRecognizedCredits >= totalCreditRequirement && isRequiredPassed) {
    isPassedFlags["CreativityAndEntrepreneurshipProgram"] = true;
  } else {
    isPassedFlags["CreativityAndEntrepreneurshipProgram"] = false;
  }

  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;

  console.log("Creativity And Entrepreneurship Result", result);
  return result;
}

function reviewCollegeRequired(
  courseList: Course[],
  rules: { [key: string]: Rule }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  for (const requiredCourse in rules) {
    const ruleKeywords = rules[requiredCourse].courseKeywords;
    const ruleCredit = rules[requiredCourse].creditRequirement;
    let recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    if (recognizedCourses.length === 0) {
      isPassedFlags[requiredCourse] = false;
      continue;
    }
    criteriaPassedCourses[requiredCourse] = recognizedCourses;
    let recognizedCredits = recognizedCourses.reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );
    if (recognizedCredits >= ruleCredit) {
      isPassedFlags[requiredCourse] = true;
    } else {
      isPassedFlags[requiredCourse] = false;
    }
    result[requiredCourse] = {
      isPassed: isPassedFlags[requiredCourse],
      criteriaPassedCourses: criteriaPassedCourses[requiredCourse],
    };
  }
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  // console.log("CollegeRequiredPassFlags", isPassedFlags);
  // console.log("CollegeRequiredCriteriaPassedCourses", criteriaPassedCourses);
  console.log("CollegeRequiredResult", result);
  return result;
}

function reviewEnglishRequiredElective(
  courseList: Course[],
  rules: { [key: string]: Rule }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  for (const rule in rules) {
    const ruleKeywords = rules[rule].courseKeywords;
    const ruleCredit = rules[rule].creditRequirement;
    const recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    criteriaPassedCourses[rule] = recognizedCourses;
    let recognizedCredits = recognizedCourses.reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );
    if (recognizedCredits >= ruleCredit) {
      isPassedFlags[rule] = true;
    } else {
      isPassedFlags[rule] = false;
    }
    result[rule] = {
      isPassed: isPassedFlags[rule],
      criteriaPassedCourses: criteriaPassedCourses[rule],
    };
  }
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  console.log("EnglishRequiredElectiveResult", result);
  return result;
}

function reviewCollegeRequiredElective(
  courseList: Course[],
  rules: { [key: string]: Rule | any }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaRecognizedCredits: number = 0;
  let criteriaCredits: number = rules["creditRequirement"];
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  criteriaPassedCourses["RecognizedElectiveCourses"] = [];
  for (const eligibleCourse in rules) {
    if (eligibleCourse === "creditRequirement") continue;

    const ruleKeywords = rules[eligibleCourse].courseKeywords;
    let recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });

    if (recognizedCourses.length > 1) {
      recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
      recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
    }
    criteriaPassedCourses["RecognizedElectiveCourses"] =
      criteriaPassedCourses["RecognizedElectiveCourses"].concat(
        recognizedCourses
      );
  }
  criteriaRecognizedCredits = criteriaPassedCourses[
    "RecognizedElectiveCourses"
  ].reduce((sum, course) => sum + course.courseCredit, 0);
  if (criteriaRecognizedCredits >= criteriaCredits) {
    isPassedFlags["CollegeRequiredElective"] = true;
  } else {
    isPassedFlags["CollegeRequiredElective"] = false;
  }
  result["CollegeRequiredElective"] = {
    isPassed: isPassedFlags["CollegeRequiredElective"],
    criteriaPassedCourses: criteriaPassedCourses["RecognizedElectiveCourses"],
  };
  result["isRulePassed"] = isPassedFlags["CollegeRequiredElective"];
  console.log("CollegeRequiredElectiveResult", result);
  return result;
}

function reviewServiceLearning(
  courseList: Course[],
  rules: { [key: string]: Rule }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  for (const rule in rules) {
    const ruleKeywords = rules[rule].courseKeywords;
    const recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    criteriaPassedCourses[rule] = recognizedCourses;
  }
  if (criteriaPassedCourses.SL.length >= 2) {
    isPassedFlags["serviceLearning"] = true;
  } else {
    isPassedFlags["serviceLearning"] = false;
  }
  result["serviceLearning"] = {
    isPassed: isPassedFlags["serviceLearning"],
    criteriaPassedCourses: criteriaPassedCourses["SL"],
  };
  result["isRulePassed"] = isPassedFlags["serviceLearning"];
  console.log("ServiceLearningResult", result);
  return result;
  // console.log("ServiceLearningPassFlags", isPassedFlags);
  // console.log("ServiceLearningCriteriaPassedCourses", criteriaPassedCourses);
}

function reviewCSMajor(courseList: Course[], rules: { [key: string]: Rule }) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  for (const rule in rules) {
    if (rule === "CEECSElective") {
      // CEECS Elective is a special case, it should consider both the CEECS courses keywords and the courses' type as elctive
      const ruleKeywords = rules[rule].courseKeywords;
      let recognizedCourses = courseList.filter((course) => {
        return ruleKeywords
          .map((keyword: string) => new RegExp(keyword))
          .some(
            (regex: RegExp) =>
              regex.test(course.courseID) && course.courseType === "選修"
          ); // Adding required course type checking
      });
      criteriaPassedCourses[rule] = recognizedCourses;
      let recognizedCredit = recognizedCourses.reduce(
        (sum, course) => sum + course.courseCredit,
        0
      );
      if (recognizedCredit >= rules[rule].creditRequirement) {
        isPassedFlags[rule] = true;
      } else {
        isPassedFlags[rule] = false;
      }
      result[rule] = {
        isPassed: isPassedFlags[rule],
        criteriaPassedCourses: criteriaPassedCourses[rule],
      };
      continue;
    }
    // Other rules are followed the same pattern as the general required courses rule
    const ruleKeywords = rules[rule].courseKeywords;
    let recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    // If there are no recognized courses, the required course is not passed, continue to the next required course but set the flag to false
    if (recognizedCourses.length === 0) {
      isPassedFlags[rule] = false;
      result[rule] = {
        isPassed: isPassedFlags[rule],
        criteriaPassedCourses: [],
      };
      continue;
    }
    if (recognizedCourses.length > 1) {
      recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
      recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
    }

    let recognizedCredit = recognizedCourses.reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );

    if (recognizedCredit >= rules[rule].creditRequirement) {
      isPassedFlags[rule] = true;
    } else {
      isPassedFlags[rule] = false;
    }
    criteriaPassedCourses[rule] = recognizedCourses;
    result[rule] = {
      isPassed: isPassedFlags[rule],
      criteriaPassedCourses: criteriaPassedCourses[rule],
    };
  }
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  console.log("CSMajorResult", result);
  return result;
  // console.log("CSMajorPassFlags", isPassedFlags);
  // console.log("CSMajorCriteriaPassedCourses", criteriaPassedCourses);
}

function reviewNetworkMajor(
  courseList: Course[],
  rules: { [key: string]: Rule }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  for (const rule in rules) {
    if (rule === "CEECSElective") {
      // CEECS Elective is a special case, it should consider both the CEECS courses keywords and the courses' type as elctive
      const ruleKeywords = rules[rule].courseKeywords;
      let recognizedCourses = courseList.filter((course) => {
        return ruleKeywords
          .map((keyword: string) => new RegExp(keyword))
          .some(
            (regex: RegExp) =>
              regex.test(course.courseID) && course.courseType === "選修"
          ); // Adding required course type checking
      });
      criteriaPassedCourses[rule] = recognizedCourses;
      let recognizedCredit = recognizedCourses.reduce(
        (sum, course) => sum + course.courseCredit,
        0
      );
      if (recognizedCredit >= rules[rule].creditRequirement) {
        isPassedFlags[rule] = true;
      } else {
        isPassedFlags[rule] = false;
      }
      result[rule] = {
        isPassed: isPassedFlags[rule],
        criteriaPassedCourses: criteriaPassedCourses[rule],
      };
      continue;
    }
    // Other rules are followed the same pattern as the general required courses rule
    const ruleKeywords = rules[rule].courseKeywords;
    let recognizedCourses = courseList.filter((course) => {
      return ruleKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    // If there are no recognized courses, the required course is not passed, continue to the next required course but set the flag to false
    if (recognizedCourses.length === 0) {
      isPassedFlags[rule] = false;
      result[rule] = {
        isPassed: isPassedFlags[rule],
        criteriaPassedCourses: [],
      };
      continue;
    }
    if (recognizedCourses.length > 1) {
      recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
      recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
    }
    let recognizedCredit = recognizedCourses.reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );

    if (recognizedCredit >= rules[rule].creditRequirement) {
      isPassedFlags[rule] = true;
    } else {
      isPassedFlags[rule] = false;
    }
    criteriaPassedCourses[rule] = recognizedCourses;
    result[rule] = {
      isPassed: isPassedFlags[rule],
      criteriaPassedCourses: criteriaPassedCourses[rule],
    };
  }
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  console.log("NetworkMajorResult", result);
  return result;
  // console.log("NetworkMajorPassFlags", isPassedFlags);
  // console.log("NetworkMajorCriteriaPassedCourses", criteriaPassedCourses);
}

function reviewEEMajor(
  courseList: Course[],
  rules: { [key: string]: Rule | any }
) {
  let result: any = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};
  let requiredElectiveRecognizedCourses: Course[] = [];
  // EE rules are more complicated than CS and Network, for code clearity, we handle them differently

  // 1. Required (The same as commonRequired pipeline)
  let required = rules.Required;
  for (const requiredCourse in required) {
    let courseKeywords = required[requiredCourse].courseKeywords;
    let recognizedCourses = courseList.filter((course) => {
      return courseKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    // If there are no recognized courses, the required course is not passed, continue to the next required course but set the flag to false
    if (recognizedCourses.length === 0) {
      isPassedFlags[requiredCourse] = false;
      result[requiredCourse] = {
        isPassed: isPassedFlags[requiredCourse],
        criteriaPassedCourses: [],
      };
      continue;
    }
    if (recognizedCourses.length > 1) {
      recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
      recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
    }
    let recognizedCredit = recognizedCourses[0].courseCredit;

    if (recognizedCredit === required[requiredCourse].creditRequirement) {
      isPassedFlags[requiredCourse] = true;
    } else {
      isPassedFlags[requiredCourse] = false;
    }

    criteriaPassedCourses[requiredCourse] = recognizedCourses;
    result[requiredCourse] = {
      isPassed: isPassedFlags[requiredCourse],
      criteriaPassedCourses: criteriaPassedCourses[requiredCourse],
    };
  }

  // 2. Experiment Group (Should choose courses from at least three groups)
  let experimentGroup = rules.ExperimentGroup;
  let experimentGroupPassed = 0;
  let experimentGroupRecognizedCredits = 0;

  for (const group in experimentGroup) {
    criteriaPassedCourses[group] = [];
    for (const eligibleCourse in experimentGroup[group]) {
      let courseKeywords =
        experimentGroup[group][eligibleCourse].courseKeywords;
      let recognizedCourses: Course[] = courseList.filter((course) => {
        return courseKeywords
          .map((keyword: string) => new RegExp(keyword))
          .some((regex: RegExp) => regex.test(course.courseID));
      });

      if (recognizedCourses.length > 1) {
        recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
        recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
      }

      criteriaPassedCourses[group] =
        criteriaPassedCourses[group].concat(recognizedCourses);
    }

    experimentGroupRecognizedCredits += criteriaPassedCourses[group].reduce(
      (sum, course) => sum + course.courseCredit,
      0
    );
    if (criteriaPassedCourses[group].length > 0) {
      experimentGroupPassed += 1;
    }
    // Add the recognized courses to the requiredElectiveRecognizedCourses list to be excluded for CEECSElective criteria
    requiredElectiveRecognizedCourses =
      requiredElectiveRecognizedCourses.concat(criteriaPassedCourses[group]);
  }
  if (
    experimentGroupPassed === experimentGroup.crossCategoryRequirement &&
    experimentGroupRecognizedCredits >= experimentGroup.creditRequirement
  ) {
    isPassedFlags["ExperimentGroup"] = true;
  } else {
    isPassedFlags["ExperimentGroup"] = false;
  }
  result["ExperimentGroup"] = {
    isRulePassed: isPassedFlags["ExperimentGroup"],
  };
  for (const group in experimentGroup) {
    if (group === "crossCategoryRequirement" || group === "creditRequirement")
      continue;
    result["ExperimentGroup"][group] = {
      isPassed: criteriaPassedCourses[group].length > 0,
      criteriaPassedCourses: criteriaPassedCourses[group],
    };
  }
  // 3. AsteriskRequiredElective (Should choose courses from at least three categories)
  let asteriskRequiredElective = rules.AsteriskRequiredElective;
  let isCrossCategoryPassed = false;
  let asteriskRequiredElectiveRecognizedCredits = 0;
  // Fxxking Annoying Special Case: Electronics III (EE3001) is a course that overlaps with two categories.
  // Since students could determine which categories it belongs to, of Electronics and SolidState, we consider it lastly.

  // First we remove the EE3001 from the course list
  let courseListWOElectronics = courseList.filter(
    (course) => course.courseID !== "EE3001"
  );
  let recognizedCategoryDict: { [key: string]: boolean } = {
    ElectronicsCategory: false,
    SolidStateCategory: false,
    SystemsAndBiomedicalCategory: false,
    ElectromagneticWavesCategory: false,
  };
  for (const category in asteriskRequiredElective) {
    criteriaPassedCourses[category] = [];
    for (const eligibleCourse in asteriskRequiredElective[category]) {
      let courseKeywords =
        asteriskRequiredElective[category][eligibleCourse].courseKeywords;
      let recognizedCourses: Course[] = courseListWOElectronics.filter(
        (course) => {
          return courseKeywords
            .map((keyword: string) => new RegExp(keyword))
            .some((regex: RegExp) => regex.test(course.courseID));
        }
      );

      if (recognizedCourses.length > 1) {
        recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
        recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
      }
      criteriaPassedCourses[category] =
        criteriaPassedCourses[category].concat(recognizedCourses);
    }

    if (criteriaPassedCourses[category].length > 0) {
      recognizedCategoryDict[category] = true;
    }
  }
  // Here we consider the EE3001, adaptively assign to either Electronics or SolidState if it is recognized and the category is not assigned yet.
  // Case 1: The student has already been recognized cross-category requirement(3), then the EE3001 is no need to be considered.
  if (
    Object.values(recognizedCategoryDict).filter((value) => value === true)
      .length >= asteriskRequiredElective.crossCategoryRequirement
  ) {
    console.log("case 1");
    isCrossCategoryPassed = true;
    let EE3001 = courseList.filter((course) => course.courseID === "EE3001");

    // Default assign to Electronics if the cross-category requirement is satisfied.
    if (EE3001.length > 0) {
      criteriaPassedCourses.ElectronicsCategory =
        criteriaPassedCourses.ElectronicsCategory.concat(EE3001);
    }
    // Case 2: The student has not been recognized cross-category requirement(3), then the EE3001 is considered and adaptively assigned.
  } else if (
    courseList.filter((course) => course.courseID === "EE3001").length > 0
  ) {
    let EE3001 = courseList.filter((course) => course.courseID === "EE3001");
    if (recognizedCategoryDict.ElectronicsCategory === false) {
      recognizedCategoryDict.ElectronicsCategory = true;
      criteriaPassedCourses.ElectronicsCategory =
        criteriaPassedCourses.ElectronicsCategory.concat(EE3001);
    } else if (recognizedCategoryDict.SolidStateCategory === false) {
      recognizedCategoryDict.SolidStateCategory = true;
      criteriaPassedCourses.SolidStateCategory =
        criteriaPassedCourses.SolidStateCategory.concat(EE3001);
    }
    // Recheck if cross-category requirement is satisfied after the EE3001 is adaptively assigned.
    if (
      Object.values(recognizedCategoryDict).filter((value) => value === true)
        .length >= asteriskRequiredElective.crossCategoryRequirement
    ) {
      isCrossCategoryPassed = true;
    } else {
      isCrossCategoryPassed = false;
    }
    // Case 3: The student has not been recognized cross-category requirement(3), and the EE3001 is not recognized, then the cross-category requirement is not satisfied.
  } else {
    isCrossCategoryPassed = false;
  }
  let asteriskRequiredElectiveRecognizedCourses = Object.keys(
    criteriaPassedCourses
  )
    .filter((key) => Object.keys(recognizedCategoryDict).includes(key))
    .reduce<{ [key: string]: any }>((result, key) => {
      result[key] = criteriaPassedCourses[key];
      return result;
    }, {});
  console.log(
    "asteriskRequiredElectiveRecognizedCourses",
    asteriskRequiredElectiveRecognizedCourses
  );
  asteriskRequiredElectiveRecognizedCredits = Object.values(
    asteriskRequiredElectiveRecognizedCourses
  ).reduce(
    (sum, courses) =>
      sum +
      courses.reduce(
        (sum: number, course: { courseCredit: number }) =>
          sum + course.courseCredit,
        0
      ),
    0
  );
  // Add the recognized courses to the requiredElectiveRecognizedCourses list to be excluded for CEECSElective criteria
  for (const category in asteriskRequiredElectiveRecognizedCourses) {
    requiredElectiveRecognizedCourses =
      requiredElectiveRecognizedCourses.concat(
        asteriskRequiredElectiveRecognizedCourses[category]
      );
  }

  if (
    isCrossCategoryPassed &&
    asteriskRequiredElectiveRecognizedCredits >=
      asteriskRequiredElective.creditRequirement
  ) {
    isPassedFlags["AsteriskRequiredElective"] = true;
  } else {
    isPassedFlags["AsteriskRequiredElective"] = false;
  }
  result["AsteriskRequiredElective"] = {
    isRulePassed: isPassedFlags["AsteriskRequiredElective"],
  };
  for (const category in asteriskRequiredElectiveRecognizedCourses) {
    result["AsteriskRequiredElective"][category] = {
      isPassed: recognizedCategoryDict[category],
      criteriaPassedCourses:
        asteriskRequiredElectiveRecognizedCourses[category],
    };
  }
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  console.log("EEMajorResult", result);
  return result;
}

function reviewCOMajor(
  courseList: Course[],
  rules: { [key: string]: Rule | any }
) {
  let result: ResultDict = {};
  let isPassedFlags: IsPassedFlagsDict = {};
  let criteriaPassedCourses: CriteriaPassedCoursesDict = {};

  // For code clearity, we handle the COMajor rules differently as the EE Major did.
  // 1. Required (The same as commonRequired pipeline)
  let required = rules.Required;
  for (const requiredCourse in required) {
    let courseKeywords = required[requiredCourse].courseKeywords;
    let recognizedCourses = courseList.filter((course) => {
      return courseKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });
    // If there are no recognized courses, the required course is not passed, continue to the next required course but set the flag to false
    if (recognizedCourses.length === 0) {
      isPassedFlags[requiredCourse] = false;
      result[requiredCourse] = {
        isPassed: isPassedFlags[requiredCourse],
        criteriaPassedCourses: [],
      };
      continue;
    }
    if (recognizedCourses.length > 1) {
      recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
      recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
    }
    let recognizedCredit = recognizedCourses[0].courseCredit;

    if (recognizedCredit === required[requiredCourse].creditRequirement) {
      isPassedFlags[requiredCourse] = true;
    } else {
      isPassedFlags[requiredCourse] = false;
    }

    criteriaPassedCourses[requiredCourse] = recognizedCourses;
    result[requiredCourse] = {
      isPassed: isPassedFlags[requiredCourse],
      criteriaPassedCourses: criteriaPassedCourses[requiredCourse],
    };
  }
  // 2. AsteriskRequiredElective
  let asteriskRequiredElective = rules.AsteriskRequiredElective;
  let asteriskRequiredElectiveRecognizedCredits: number = 0;
  criteriaPassedCourses["asteriskRequiredElective"] = [];
  for (const eligibleCourse in asteriskRequiredElective) {
    if (eligibleCourse === "creditRequirement") continue; // Skip the creditRequirement key
    let courseKeywords =
      asteriskRequiredElective[eligibleCourse].courseKeywords;
    let recognizedCourses = courseList.filter((course) => {
      return courseKeywords
        .map((keyword: string) => new RegExp(keyword))
        .some((regex: RegExp) => regex.test(course.courseID));
    });

    if (recognizedCourses.length > 1) {
      recognizedCourses.sort((a, b) => b.courseCredit - a.courseCredit); // Sort the courses by credit in descending order
      recognizedCourses = recognizedCourses.slice(0, 1); // Only the first course is counted as those are equivalent courses and others are ignored
    }
    criteriaPassedCourses["asteriskRequiredElective"] =
      criteriaPassedCourses["asteriskRequiredElective"].concat(
        recognizedCourses
      );
  }
  asteriskRequiredElectiveRecognizedCredits = criteriaPassedCourses[
    "asteriskRequiredElective"
  ].reduce((sum, course) => sum + course.courseCredit, 0);
  if (
    asteriskRequiredElectiveRecognizedCredits >=
    asteriskRequiredElective.creditRequirement
  ) {
    isPassedFlags["asteriskRequiredElective"] = true;
  } else {
    isPassedFlags["asteriskRequiredElective"] = false;
  }
  result["asteriskRequiredElective"] = {
    isPassed: isPassedFlags["asteriskRequiredElective"],
    criteriaPassedCourses: criteriaPassedCourses["asteriskRequiredElective"],
  };

  // 3. CEECSElective
  let CEECSElective = rules.CEECSElective;
  let CEECSElectiveRecognizedCredits: number = 0;
  let courseListWOAsteriskRequiredElective = courseList.filter(
    (course) =>
      !criteriaPassedCourses["asteriskRequiredElective"].includes(course)
  );
  let CEECSElectiveCourseKeywords = CEECSElective.courseKeywords;
  let CEECSElectiveRecognizedCourses =
    courseListWOAsteriskRequiredElective.filter((course) => {
      return CEECSElectiveCourseKeywords.map(
        (keyword: string) => new RegExp(keyword)
      ).some(
        (regex: RegExp) =>
          regex.test(course.courseID) && course.courseType === "選修"
      );
    });
  criteriaPassedCourses["CEECSElective"] = CEECSElectiveRecognizedCourses;
  CEECSElectiveRecognizedCredits = CEECSElectiveRecognizedCourses.reduce(
    (sum, course) => sum + course.courseCredit,
    0
  );
  if (CEECSElectiveRecognizedCredits >= CEECSElective.creditRequirement) {
    isPassedFlags["CEECSElective"] = true;
  } else {
    isPassedFlags["CEECSElective"] = false;
  }
  result["CEECSElective"] = {
    isPassed: isPassedFlags["CEECSElective"],
    criteriaPassedCourses: criteriaPassedCourses["CEECSElective"],
  };
  // console.log("COMajorPassFlags", isPassedFlags);
  // console.log("COMajorCriteriaPassedCourses", criteriaPassedCourses);
  const isRulePassed = Object.values(isPassedFlags).every(
    (value) => value === true
  );
  result["isRulePassed"] = isRulePassed;
  console.log("COMajorResult", result);
  return result;
}

function createTopSection(
  courseList: Course[],
  totalCreditRequirement: number,
  generalInfo: any
) {
  const totalCredits = courseList.reduce(
    (sum, course) => sum + course.courseCredit,
    0
  );
  const isTotalCreditPassed = totalCredits >= totalCreditRequirement;
  const textColor = isTotalCreditPassed ? "#96ee11" : "#ff5050";
  const htmlString = `
  <div class="container mt-5">
    <h1 class="display-2">NCU IPEECS Graduation Review Report</h1>
    <h2 class="mb-4 display-4">General Information</h2>
    <h2 class="mb-4 display-4">Name: ${generalInfo.studentName}</h2>
    <h2 class="mb-4 display-4">ID: ${generalInfo.studentID}</h2>
    <h2 class="display-4">Total Credits: ${totalCredits}</h2>
    <h2 style="color : ${textColor}" class="display-4">Total Credits Passed: ${isTotalCreditPassed}</h2>
    <h2 class="display-4"> All Recognized Courses: </h2>
    <ul class="list-group">
      ${courseList
        .map(
          (course) => `
        <li key="${course.courseID}" class="list-group-item">
          <strong>${course.courseID}</strong><strong>${course.courseName}</strong> (${course.courseCredit} credits)
        </li>
      `
        )
        .join("")}
    </ul>
  </div>
`;
  return renderToString(
    <div dangerouslySetInnerHTML={{ __html: htmlString }} />
  );
}
function createCommonSection(result: ResultDict, criteria: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isRulePassed = result["isRulePassed"];
  delete result["isRulePassed"];
  const textColor = isRulePassed ? "#96ee11" : "#ff5050";
  const htmlString = `
  <div class="container mt-5">
    <h2 class="mb-4">${criteria}</h2>
    <h2 style="color: ${textColor}" ><strong>Passed: </strong>${String(
    isRulePassed
  )}</h2>
    <div class="row">
      ${Object.entries(result)
        .map(
          ([category, categoryData]) => `
        <div key="${category}" class="col-md-6 mb-4">
          <div class="card ${
            (categoryData as { isPassed: boolean }).isPassed
              ? "border-success"
              : "border-danger"
          }">
            <div class="card-body">
              <h5 class="card-title">${category}</h5>
              <p class="card-text">
                <strong>Passed:</strong> ${
                  (categoryData as { isPassed: boolean }).isPassed
                    ? "Yes"
                    : "No"
                }
              </p>
              <ul class="list-group">
                ${(
                  categoryData as { criteriaPassedCourses: Course[] }
                ).criteriaPassedCourses
                  .map(
                    (course) => `
                  <li key="${course.courseID}" class="list-group-item">
                    <strong>${course.courseID}</strong><strong>${course.courseName}</strong> (${course.courseCredit} credits)
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  </div>
`;
  return renderToString(
    <div dangerouslySetInnerHTML={{ __html: htmlString }} />
  );
}
// Special Case, should display the group and courses
function createEESection(result: ResultDict | any, criteria: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isRulePassed = result["isRulePassed"];
  const isRulePassedTextColor = isRulePassed ? "#96ee11" : "#ff5050";
  const isRulePassedText = isRulePassed ? "Yes":"No";
  delete result["isRulePassed"];
  // 1. Required (The same as commonRequired pipeline)
  let resultWOAsteriskAndExperiment = Object.fromEntries(
    Object.entries(result).filter(
      ([key, value]) =>
        key !== "AsteriskRequiredElective" && key !== "ExperimentGroup"
    )
  );
  console.log("resultWOAsteriskAndExperiment", resultWOAsteriskAndExperiment);

  // 2. Experiment Group (should display group and courses)
  let resultExperimentGroup = result["ExperimentGroup"];
  let isExperimentGroupPassed = resultExperimentGroup["isRulePassed"];
  let isExperimentGroupPassedTextColor = isExperimentGroupPassed ? "#96ee11" : "#ff5050";
  let isExperimentGroupPassedText = isExperimentGroupPassed ? "Yes":"No";

  delete resultExperimentGroup["isRulePassed"];

  // 3. AsteriskRequiredElective (should display category and courses)
  let resultAsteriskRequiredElective = result["AsteriskRequiredElective"];
  let isAsteriskRequiredElectivePassed = resultAsteriskRequiredElective["isRulePassed"];
  let isAsteriskRequiredElectivePassedTextColor = isAsteriskRequiredElectivePassed ? "#96ee11" : "#ff5050";
  let isAsteriskRequiredElectivePassedText = isAsteriskRequiredElectivePassed ? "Yes":"No";

  
  delete resultAsteriskRequiredElective["isRulePassed"];

  let htmlString = `
    <div class="container mt-5">
    <h2 class="mb-4">${criteria}</h2>
    <h2 style="color: ${isRulePassedTextColor}"><strong>Passed: </strong>${isRulePassedText}</h2>
    <div class="row">
      <div class="row">
        ${Object.entries(resultWOAsteriskAndExperiment)
          .map(
            ([category, categoryData]) => `
          <div key="${category}" class="col-md-6 mb-4">
          <div class="card ${
            (categoryData as { isPassed: boolean }).isPassed
              ? "border-success"
              : "border-danger"
          }">
              <div class="card-body">
                <h5 class="card-title">${category}</h5>
                <p class="card-text">
                  <strong>Passed:</strong> ${
                    (categoryData as { isPassed: boolean }).isPassed
                      ? "Yes"
                      : "No"
                  }
                </p>
                <ul class="list-group">
                  ${(
                    categoryData as { criteriaPassedCourses: Course[] }
                  ).criteriaPassedCourses
                    .map(
                      (course) => `
                    <li key="${course.courseID}" class="list-group-item">
                      <strong>${course.courseID}</strong><strong>${course.courseName}</strong> (${course.courseCredit} credits)
                    </li>
                  `
                    )
                    .join("")}
                </ul>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      
      <h2 style="color: ${isExperimentGroupPassedTextColor}" >Experiment Group Cross Category Passed: ${isExperimentGroupPassedText}</h2>
      <div class="row">
        ${Object.entries(resultExperimentGroup)
          .map(
            ([category, categoryData]) => `
          <div key="${category}" class="col-md-6 mb-4">
          <div class="card ${
            (categoryData as { isPassed: boolean }).isPassed
              ? "border-success"
              : "border-danger"
          }">
              <div class="card-body">
                <h5 class="card-title">${category}</h5>
                <p class="card-text">
                  <strong>Passed:</strong> ${
                    (categoryData as { isPassed: boolean }).isPassed
                      ? "Yes"
                      : "No"
                  }
                </p>
                <ul class="list-group">
                  ${(
                    categoryData as { criteriaPassedCourses: Course[] }
                  ).criteriaPassedCourses
                    .map(
                      (course) => `
                    <li key="${course.courseID}" class="list-group-item">
                      <strong>${course.courseID}</strong><strong>${course.courseName}</strong> (${course.courseCredit} credits)
                    </li>
                  `
                    )
                    .join("")}
                </ul>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      <h2 style="color: ${isAsteriskRequiredElectivePassedTextColor}">Asterisk Elective Cross Category Passed: ${isAsteriskRequiredElectivePassedText}</h2>
      <div class="row">
        ${Object.entries(resultAsteriskRequiredElective)
          .map(
            ([category, categoryData]) => `
          <div key="${category}" class="col-md-6 mb-4">
          <div class="card ${
            (categoryData as { isPassed: boolean }).isPassed
              ? "border-success"
              : "border-danger"
          }">
              <div class="card-body">
                <h5 class="card-title">${category}</h5>
                <p class="card-text">
                  <strong>Passed:</strong> ${
                    (categoryData as { isPassed: boolean }).isPassed
                      ? "Yes"
                      : "No"
                  }
                </p>
                <ul class="list-group">
                  ${(
                    categoryData as { criteriaPassedCourses: Course[] }
                  ).criteriaPassedCourses
                    .map(
                      (course) => `
                    <li key="${course.courseID}" class="list-group-item">
                      <strong>${course.courseID}</strong><strong>${course.courseName}</strong> (${course.courseCredit} credits)
                    </li>
                  `
                    )
                    .join("")}
                </ul>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;

  return renderToString(
    <div dangerouslySetInnerHTML={{ __html: htmlString }} />
  );
}

function createHTMLFile(htmlSections: string[]) {
  let htmlString = "";
  for (const section of htmlSections) {
    htmlString += section;
  }
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Result</title>
  </head>
  <body>
    ${htmlString}
  </body>
 `;
}

function GradReviewer() {
  const AllData: any = React.useContext(CheckTableContext);
  console.log("checkData in grad viewer", AllData.checkData);
  console.log("generalInfoData in grad viewer", AllData.checkData.generalInfo);
  console.log("checkTableData in grad viewer", AllData.checkData.checkTable);

  // const generalInfoData: any = React.useContext(GeneralInfoContext);
  // console.log("generalInfoData in grad viewer", generalInfoData);
  const rulesData: any = React.useContext(RulesContext);
  const rules = rulesData.rules;
  const courseList: Course[] = AllData.checkData.checkTable.map(
    (checkTable: any) => ({
      courseID: checkTable.courseID,
      courseName: checkTable.courseName,
      courseType: checkTable.courseType,
      courseCredit: checkTable.courseCredit,
      courseGrade: checkTable.courseGrade,
    })
  );

  console.log("courses from type mapping", courseList);
  console.log("rules received by grad reviewer", rules.NetworkMajor);

  const commonRequiredResult = reviewCommonRequired(
    courseList,
    rules.commonRequired
  );
  const collegeRequiredResult = reviewCollegeRequired(
    courseList,
    rules.collegeRequired
  );
  const englishRequiredElectiveResult = reviewEnglishRequiredElective(
    courseList,
    rules.englishRequiredElective
  );
  const collegeRequiredElectiveResult = reviewCollegeRequiredElective(
    courseList,
    rules.collegeRequiredElective
  );
  const serviceLearningResult = reviewServiceLearning(
    courseList,
    rules.serviceLearning
  );
  const creativityAndEntrepreneurshipResult =
    reviewCreativityAndEntrepreneurship(
      courseList,
      rules.creativityAndEntrepreneurship
    );
  const EEMajorResult = reviewEEMajor(courseList, rules.EEMajor);
  const COMajorResult = reviewCOMajor(courseList, rules.COMajor);
  const CSMajorResult = reviewCSMajor(courseList, rules.CSMajor);
  const NetworkMajorResult = reviewNetworkMajor(courseList, rules.NetworkMajor);

  const htmlSections: string[] = [];
  htmlSections.push(
    createTopSection(courseList, 128, AllData.checkData.generalInfo)
  );

  htmlSections.push(
    createCommonSection(commonRequiredResult, "Common Required")
  );
  htmlSections.push(
    createCommonSection(collegeRequiredResult, "College Required")
  );
  htmlSections.push(
    createCommonSection(
      englishRequiredElectiveResult,
      "English Required Elective"
    )
  );
  htmlSections.push(
    createCommonSection(
      collegeRequiredElectiveResult,
      "College Required Elective"
    )
  );
  htmlSections.push(
    createCommonSection(serviceLearningResult, "Service Learning")
  );

  htmlSections.push(
    createCommonSection(CSMajorResult, "Computer Science Major")
  );
  htmlSections.push(createCommonSection(NetworkMajorResult, "Network Major"));

  htmlSections.push(
    createEESection(EEMajorResult, "Electrical Engineering Major")
  );

  htmlSections.push(
    createCommonSection(COMajorResult, "Communication Engineering Major")
  );
  htmlSections.push(
    createCommonSection(
      creativityAndEntrepreneurshipResult,
      "Creativity and Entrepreneurship Program"
    )
  );


  const handleHTMLClick = () => {
    const html = createHTMLFile(htmlSections);
    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `IPEECS_GradReviewReport_${AllData.checkData.generalInfo.studentName}_${AllData.checkData.generalInfo.studentID}.html`;
    link.click();
  }

  // const handlePDFClick = async () => {
  //   const html = createHTMLFile(htmlSections);

  //   // Create a temporary div element and append it to the document
  //   const tempDiv = document.createElement("div");
  //   tempDiv.innerHTML = html;
  //   document.body.appendChild(tempDiv);

  //   // Use html2canvas to render the element
  //   const canvas = await html2canvas(tempDiv, {scale: 0.5});

  //   // Remove the temporary div from the document
  //   document.body.removeChild(tempDiv);

  //   // Create a PDF using jsPDF
  //   const imgData = canvas.toDataURL("image/png");
  //   const pdf = new jsPDF("p", "mm", "a4");
    
  //   pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  //   pdf.save(
  //     `IPEECS_GradReviewReport_${AllData.checkData.generalInfo.studentName}_${AllData.checkData.generalInfo.studentID}.pdf`
  //   );
  // };

  return (
    <div>
      <Button variant="primary" onClick={handleHTMLClick}>
        Download HTML
      </Button>{" "}
    </div>
  );
}

export default GradReviewer;
