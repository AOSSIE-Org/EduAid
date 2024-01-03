import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";


function SplashScreenAnimation() {
  const [isCompleted, setIsCompleted] = useState(false);
  function removePage() {
    setIsCompleted(true);
  }
  useEffect(() => {
    setTimeout(() => {
        removePage();
    }, 1000);
  }, []);

  return (
    <AnimatePresence>
      {!isCompleted && (
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-background flex justify-center items-center z-50"
          exit={{ y: "-100vh" }}
          transition={{ type: "ease-out" }}
        >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl text-center"
            >
              {/* Don't Study, Learn! */}
              EDU AID
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default SplashScreenAnimation;
