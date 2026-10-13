import { motion } from 'framer-motion';
import { Target, Shield, Sparkles, Users, Coins, Star } from 'lucide-react';

export default function OurAim() {
  const features = [
    {
      icon: Shield,
      title: 'Quality Service',
      description: 'Professional cleaning with attention to detail',
      color: 'bg-blue-500',
    },
    {
      icon: Coins,
      title: 'Affordable Pricing',
      description: 'Budget-friendly solutions for everyone',
      color: 'bg-green-500',
    },
    {
      icon: Users,
      title: 'Experienced Team',
      description: 'Skilled and trained cleaning professionals',
      color: 'bg-purple-500',
    },
    {
      icon: Star,
      title: 'Customer Satisfaction',
      description: '100% satisfaction guaranteed',
      color: 'bg-yellow-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const floatingAnimation = {
    y: [-10, 10],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut",
    },
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut",
    },
  };

  const glowAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut",
    },
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"
        animate={glowAnimation}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"
        animate={glowAnimation}
      />

      <div className="container relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="inline-block p-3 rounded-2xl bg-primary/10 mb-6"
          >
            <Target className="w-6 h-6 text-primary" />
          </motion.div>
          
          <motion.h2
            variants={itemVariants}
            className="text-4xl font-bold mb-6"
          >
            Our Aim
          </motion.h2>

          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <motion.div
              className="absolute -top-6 -left-6"
              animate={floatingAnimation}
            >
              <Sparkles className="w-12 h-12 text-primary/20" />
            </motion.div>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              At <span className="font-semibold text-primary">Safaiwalay.com</span>,
              our mission is simple: to provide affordable and high-quality cleaning
              services that cater to every financial class. We believe that a clean
              and hygienic environment should not be a luxury, but a necessity
              accessible to all.
            </p>

            <motion.div
              className="absolute -bottom-6 -right-6"
              animate={floatingAnimation}
            >
              <Sparkles className="w-12 h-12 text-primary/20" />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={pulseAnimation}
              className="relative group"
            >
              <div className="relative z-10 bg-background/80 backdrop-blur-sm p-6 rounded-xl border shadow-lg">
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white transform group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
              <div className={`absolute inset-0 ${feature.color} opacity-5 blur-xl rounded-xl transform group-hover:scale-105 transition-transform`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}