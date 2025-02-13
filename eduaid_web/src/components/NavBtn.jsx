import { useNavigate } from "react-router-dom"

const NavBtn=({children,path,onClick,ClassName})=>{
    const navigate=useNavigate()
    console.log(typeof onClick)
    const onClickHandler=onClick?onClick:()=>{
        navigate(path)
    }
    return(
        <button 
        className={`bg-black items-center text-xl text-white px-4 py-2 border-gradient flex ${ClassName}`}
        onClick={onClickHandler}
        >
            {children}
        </button>
    )
}

export default NavBtn