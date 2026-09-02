import { motion } from 'framer-motion'

export function KolkataHero() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center px-12 md:px-24 pointer-events-none">
      <div className="max-w-3xl pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', staggerChildren: 0.2 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          >
            KNOW THE WATER.
          </motion.h1>
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          >
            KNOW THE CITY.
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-300 max-w-xl mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
          >
            Turn rainfall, citizen signals and drainage intelligence into faster municipal decisions.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.8 }}
          >
            <button className="px-8 py-4 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors duration-300">
              ENTER LIVE CITY →
            </button>
            <button className="px-8 py-4 bg-black/50 text-white font-semibold rounded border border-white/20 hover:bg-black/70 transition-colors duration-300 backdrop-blur-sm">
              VIEW ACTIVE INCIDENTS
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default KolkataHero
