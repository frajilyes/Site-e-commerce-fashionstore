import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaTshirt,
  FaHeart,
  FaLeaf,
  FaUsers,
  FaTruck,
  FaShieldAlt,
  FaAward,
  FaGlobe,
  FaStar,
  FaShoppingBag,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaMailBulk,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./About.css";

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x1: parseFloat((Math.random() * 100).toFixed(2)),
  x2: parseFloat((Math.random() * 100).toFixed(2)),
  size: parseFloat((2 + Math.random() * 4).toFixed(2)),
  dur: parseFloat((14 + Math.random() * 16).toFixed(2)),
  delay: parseFloat((Math.random() * 8).toFixed(2)),
  opacity: parseFloat((0.2 + Math.random() * 0.5).toFixed(2)),
}));

const statistics = [
  { icon: FaShoppingBag, number: "50K+", label: "Happy Customers" },
  { icon: FaTshirt, number: "10K+", label: "Products Sold" },
  { icon: FaStar, number: "4.9", label: "Average Rating" },
  { icon: FaGlobe, number: "25+", label: "Countries Served" },
];

const values = [
  {
    icon: FaLeaf,
    title: "Sustainability",
    description:
      "We're committed to eco-friendly practices and sustainable materials in all our products.",
    color: "#2ecc71",
  },
  {
    icon: FaHeart,
    title: "Quality First",
    description:
      "Every product is carefully crafted with attention to detail and premium materials.",
    color: "#00ff88",
  },
  {
    icon: FaUsers,
    title: "Customer Focus",
    description:
      "Your satisfaction is our priority. We're here to help you find the perfect style.",
    color: "#00bfff",
  },
  {
    icon: FaAward,
    title: "Innovation",
    description:
      "We continuously innovate to bring you the latest trends and technologies in fashion.",
    color: "#ffd700",
  },
];

const SOCIAL_LINKS = [
  { label: "Instagram", url: "https://www.instagram.com", icon: <FaInstagram /> },
  { label: "LinkedIn", url: "https://www.linkedin.com", icon: <FaLinkedin /> },
  { label: "Twitter", url: "https://www.twitter.com", icon: <FaTwitter /> },
];

const teamMembers = [
  {
    name: "Alex Johnson",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=60",
    bio: "Visionary leader with 15+ years in fashion industry.",
  },
  {
    name: "Sarah Chen",
    role: "Head of Design",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60",
    bio: "Creative director shaping our brand's aesthetic vision.",
  },
  {
    name: "Michael Brown",
    role: "Operations Director",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=60",
    bio: "Ensuring seamless operations and customer satisfaction.",
  },
  {
    name: "Emma Wilson",
    role: "Marketing Lead",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60",
    bio: "Building connections with our amazing community.",
  },
];

const features = [
  {
    icon: FaTruck,
    title: "Free Shipping",
    description: "Free shipping on orders over $75",
  },
  {
    icon: FaShieldAlt,
    title: "Secure Payment",
    description: "100% secure payment processing",
  },
  {
    icon: FaClock,
    title: "Fast Delivery",
    description: "2-5 business days delivery",
  },
  {
    icon: FaCheckCircle,
    title: "Quality Guarantee",
    description: "30-day return policy",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const About = () => {
  const user = useSelector((state) => state.auth?.user || null);

  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate("/shoplanding");
  };

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="about-hero-overlay" />
        <div className="about-hero-gradient" />
        <div className="about-glow g1" />
        <div className="about-glow g2" />
        <div className="about-glow g3" />

        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="about-particle"
            initial={{ y: "-10%", x: `${p.x1}%` }}
            animate={{
              y: ["-10%", "110%"],
              x: [`${p.x1}%`, `${p.x2}%`],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
            style={{
              left: 0,
              top: 0,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
            }}
          />
        ))}

        <div className="about-hero-content">
          <motion.div
            className="about-tag"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="about-tag-dot" />
            About Us
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            We're More Than
            <br />
            <span className="about-neon">Just a Clothing Store</span>
          </motion.h1>

          <motion.p
            className="about-hero-desc"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Founded in 2020, we're on a mission to make quality fashion
            <br />
            accessible to everyone. Style, comfort, and sustainability combined.
          </motion.p>

          <motion.div
            className="about-hero-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <motion.button
              className="about-cta-btn"
              onClick={handleShopNow}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user ? `Welcome back, ${user.firstName}` : "Shop Now"}{" "}
              <FaArrowRight />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-container">
          <motion.div
            className="about-story-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <h2>Our Story</h2>
              <div className="about-story-line" />
            </motion.div>

            <motion.p variants={fadeInUp}>
              What started as a small boutique in 2020 has grown into a global
              fashion destination. Our journey began with a simple belief:
              everyone deserves access to quality, stylish clothing without
              compromising on values.
            </motion.p>

            <motion.p variants={fadeInUp}>
              Today, we serve customers in over 25 countries, offering curated
              collections for men, women, and children. From everyday essentials
              to statement pieces, every item in our collection is chosen with
              care and purpose.
            </motion.p>

            <motion.p variants={fadeInUp}>
              We're not just selling clothes – we're building a community of
              fashion-forward individuals who value quality, sustainability, and
              authentic style.
            </motion.p>

            <motion.div variants={fadeInUp} className="about-story-stats">
              {statistics.map((stat, i) => (
                <motion.div
                  key={i}
                  className="about-stat-card"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <stat.icon className="about-stat-icon" />
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="about-story-image"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop&q=60"
              alt="Our Store"
            />
            <div className="about-story-image-overlay" />
          </motion.div>
        </div>
      </section>

      <section className="about-values">
        <div className="about-values-container">
          <motion.div
            className="about-section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp}>Our Values</motion.h2>
            <motion.div variants={fadeInUp} className="about-section-line" />
            <motion.p variants={fadeInUp}>
              The principles that guide everything we do
            </motion.p>
          </motion.div>

          <motion.div
            className="about-values-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {values.map((value, i) => (
              <motion.div
                key={i}
                className="about-value-card"
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="about-value-icon"
                  style={{ color: value.color }}
                >
                  <value.icon />
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="about-features">
        <div className="about-features-container">
          <motion.div
            className="about-section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp}>Why Choose Us</motion.h2>
            <motion.div variants={fadeInUp} className="about-section-line" />
          </motion.div>

          <motion.div
            className="about-features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="about-feature-card"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="about-feature-icon">
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="about-team">
        <div className="about-team-container">
          <motion.div
            className="about-section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp}>Meet Our Team</motion.h2>
            <motion.div variants={fadeInUp} className="about-section-line" />
            <motion.p variants={fadeInUp}>
              The passionate people behind our brand
            </motion.p>
          </motion.div>

          <motion.div
            className="about-team-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                className="about-team-card"
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="about-team-image">
                  <img src={member.image} alt={member.name} />
                  <div className="about-team-overlay">
                    <div className="about-team-social">
                      {SOCIAL_LINKS.map((social) => (
                        <motion.a
                          key={social.label}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.3, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          title={social.label}
                        >
                          {social.icon}
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="about-team-info">
                  <h3>{member.name}</h3>
                  <p className="about-team-role">{member.role}</p>
                  <p className="about-team-bio">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-cta-container">
          <motion.div
            className="about-cta-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp}>
              {user
                ? "Ready to Continue Shopping?"
                : "Ready to Join Our Community?"}
            </motion.h2>
            <motion.p variants={fadeInUp}>
              Discover our collections and find your perfect style today.
            </motion.p>
            <motion.div variants={fadeInUp} className="about-cta-buttons">
              <motion.button
                className="about-cta-primary"
                onClick={handleShopNow}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Shop Collection <FaArrowRight />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="about-contact">
        <div className="about-contact-container">
          <motion.div
            className="about-contact-info"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp}>Get In Touch</motion.h2>
            <motion.div variants={fadeInUp} className="about-contact-line" />

            <motion.div variants={fadeInUp} className="about-contact-items">
              <div className="about-contact-item">
                <FaMapMarkerAlt className="about-contact-icon" />
                <div>
                  <h4>Address</h4>
                  <p>123 Fashion Street, New York, NY 10001</p>
                </div>
              </div>

              <div className="about-contact-item">
                <FaPhone className="about-contact-icon" />
                <div>
                  <h4>Phone</h4>
                  <p>+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="about-contact-item">
                <FaMailBulk className="about-contact-icon" />
                <div>
                  <h4>Email</h4>
                  <p>hello@fashionstore.com</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="about-contact-map"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.119763973046!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew+York%2C+NY%2C+USA!5e0!3m2!1sen!2s!4v1647890123456!5m2!1sen!2s"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: "24px" }}
              allowFullScreen=""
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      <footer className="about-footer">
        <div className="about-footer-container">
          <div className="about-footer-content">
            <div className="about-footer-logo">
              <FaTshirt className="footer-logo-icon" />
              <span>FasionStore</span>
            </div>
            <p>© 2026 FashionStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
