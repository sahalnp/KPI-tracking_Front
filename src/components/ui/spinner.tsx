"use client"

import { motion, Variants } from "motion/react"

// function LoadingThreeDotsPulse() {
//   const dotVariants: Variants = {
//     pulse: {
//       scale: [1, 1.5, 1],
//       transition: {
//         duration: 1.2,
//         repeat: Infinity,
//         ease: "easeInOut",
//       },
//     },
//   }

//   return (
//     <motion.div
//       animate="pulse"
//       transition={{ staggerChildren: -0.2, staggerDirection: -1 }}
//       className="container"
//     >
//       <motion.div className="dot" variants={dotVariants} />
//       <motion.div className="dot" variants={dotVariants} />
//       <motion.div className="dot" variants={dotVariants} />
//       <StyleSheet />
//     </motion.div>
//   )
// }

// /**
//  * ==============   Styles   ================
//  */
// function StyleSheet() {
//   return (
//     <style>
//       {`
//         .container {
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           gap: 20px;
//         }

//         .dot {
//           width: 20px;
//           height: 20px;
//           border-radius: 50%;
//           background-color: red; /* Changed color to red */
//           will-change: transform;
//         }
//       `}
//     </style>
//   )
// }

// export default LoadingThreeDotsPulse


export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex space-x-2">
          <motion.div
            className="w-4 h-4 bg-[#FF3F33] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="w-4 h-4 bg-[#FF3F33] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.3,
            }}
          />
          <motion.div
            className="w-4 h-4 bg-[#FF3F33] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.6,
            }}
          />
        </div>
        <motion.p 
          className="text-gray-600 text-lg font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
        </motion.p>
      </div>
    </div>
  )
}