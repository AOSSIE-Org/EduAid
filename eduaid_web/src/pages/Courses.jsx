import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom";
import classroom from "../assets/classroom.png"

const Courses=()=>{
    const [courses, setCourses]=useState([]);
    const [selectedCourse, setSelectedCourse]=useState()
    const navigate=useNavigate();
    const location=useLocation();
    const qa_pairs=location.state?.qaPairs || [];

    const handlePushQuiz=async()=>{
        console.log("Thunish", selectedCourse);
        console.log(`${process.env.REACT_APP_BASE_URL}/api/v1/${selectedCourse}/add/quiz`);
        const response=await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/${selectedCourse}/add/quiz`, {
            method:"Post",
            headers:{
                "Content-Type":"application/json"
            },
            credentials:"include",
            body:JSON.stringify({
                qa_pairs:qa_pairs
            })
        });
        console.log(await response.json());
    }

    useEffect(()=>{
        const temp=async()=>{
            try{
                const  response=await fetch("http://localhost:5000/api/v1/courses", {credentials: "include"});
                const data=await response.json()
                console.log(data);
                if(response.status==401 && data.redirect){
                    window.location.href=data.url;
                    return;
                }
                if(!data.courses){
                    return alert("Error in fetching the courses")
                }
                console.log(data)
                setCourses(data.courses)
            }
            catch(error){
                console.log(error)
                console.error("Ftech failed: ", error);
            }
        }
        temp()
    }, []);

    return (
        <div>
            
            {1 &&
                <div className=" flex">
                    {
                        courses.map(course=>{
                            return(
                                <div className=" flex p-4" key={course.id}>
                                    <div  className=" bg-white shadow-xl rounded-xl max-w-sm overflow-hidden">
                                        <img src={classroom}  alt="A animated classroom image" className=" w-full h-48" />
                                        <div className=" p-4">
                                            <div className=" text-xl font-semibold mb-2">{course.name}</div>
                                            <div>Room:- {course.room}, section:- {course.section}</div>
                                        </div>
                                        <button  onClick={()=>{
                                            setSelectedCourse(course.id);
                                            handlePushQuiz();
                                        }} className={`inline bg-slate-800 px-4 py-2 m-3 rounded-md text-white
                                            ${!course.teacherFolder? "cursor-not-allowed bg-gray-600 hidden":""}`}>Add quiz</button>
                                    </div>
                                </div>  
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}

export default Courses