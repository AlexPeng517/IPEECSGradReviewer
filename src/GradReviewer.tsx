import { render } from "@testing-library/react";
import React, { useEffect } from "react";
function GradReviewer(props:any){
    return (
        <div>
            <h1>{props.rule}</h1>
        </div>
    );
       
    
}

export default GradReviewer;