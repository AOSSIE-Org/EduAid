const SiteName = ({ClassName}) => {
  return (
    <div className={`font-extrabold ${ClassName}`}>
      <span className="bg-gradient-to-r from-[#FF005C] to-[#7600F2] text-transparent bg-clip-text">
        Edu
      </span>
      <span className="bg-gradient-to-r from-[#7600F2] to-[#00CBE7] text-transparent bg-clip-text">
        Aid
      </span>
    </div>
  )
}

export default SiteName