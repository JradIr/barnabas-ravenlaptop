// src/components/About.jsx

import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Button, Fab, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import "./style/About.css";

const About = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  // Scroll animation observer - works both scrolling up and down
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll top button
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Animate sections on scroll - works both directions
      const animatedElements = document.querySelectorAll(".fade-left, .fade-right, .fade-up");
      animatedElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        
        // Element is visible in viewport
        if (elementTop < windowHeight - 80 && elementBottom > 80) {
          element.classList.add("visible");
        } else {
          // Remove class when scrolled away, allowing re-animation when scrolling back
          element.classList.remove("visible");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Scroll to Top Button */}
      <Fab
        className={`scroll-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        color="primary"
        aria-label="scroll to top"
      >
        <ArrowUpwardIcon />
      </Fab>

      {/* Hero Section */}
      <Box className="about-hero-section">
        <Container maxWidth="lg">
          <Box className="about-hero-content">
            <div className="hero-badge">
              <EmojiEventsIcon className="badge-icon" />
              <Typography variant="body2">Welcome to Our Clinic</Typography>
            </div>
            <Typography variant="h1" className="about-hero-title">
              About Barnabas Dental Clinic
            </Typography>
            <Typography variant="h5" className="about-hero-subtitle">
              Compassionate care, modern dentistry, and your smile at the heart of everything we do.
            </Typography>
          </Box>
        </Container>
        <div className="hero-bg-animation">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
          <div className="hero-circle hero-circle-4"></div>
        </div>
      </Box>

      {/* Our Philosophy Section */}
      <Box className="section philosophy-section">
        <Container maxWidth="lg">
          <Box className="philosophy-content">
            <Typography variant="body1" className="philosophy-text fade-left">
              At Barnabas Dental Clinic, we believe that a healthy smile is the foundation of confidence and well-being. 
              Our philosophy is simple: treat every patient like family, listen to their concerns, and provide 
              personalized care that meets their unique needs.
            </Typography>
            <Typography variant="body1" className="philosophy-text fade-right">
              We understand that visiting the dentist can be stressful for many people. That's why we've created 
              a warm, welcoming environment where you can feel at ease. From the moment you walk through our doors, 
              you'll be treated with respect, compassion, and genuine care.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Our Story Section */}
      <Box className="section story-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title fade-up">
            Our Story
          </Typography>
          <Box className="story-content">
            <Typography variant="body1" className="story-text fade-left">
              Founded in 2018, Barnabas Dental Clinic was born from a vision to create a dental practice that 
              prioritizes patient comfort while delivering exceptional clinical outcomes. What started as a 
              small, single-doctor practice has grown into a trusted name in dental care.
            </Typography>
            <Typography variant="body1" className="story-text fade-right">
              Our journey has been guided by a simple belief: everyone deserves access to quality dental care 
              in a setting that feels safe and welcoming. We've built our clinic around this principle, 
              investing in modern technology and continuing education to serve you better.
            </Typography>
            <Typography variant="body1" className="story-text fade-left">
              Today, we're proud to be a growing practice that puts patients first. Every day, we strive to 
              live up to the trust our patients place in us, delivering care that makes a real difference 
              in their lives.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Meet Dr. Ophelia Section */}
      <Box className="section doctor-section">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box className="doctor-image-wrapper fade-left">
                <div className="doctor-placeholder">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="95" fill="#e8f5f4" stroke="#2ca6a4" strokeWidth="3"/>
                    <circle cx="100" cy="75" r="25" fill="#2ca6a4" opacity="0.8"/>
                    <path d="M 50 130 Q 75 115 100 115 Q 125 115 150 130" stroke="#2ca6a4" strokeWidth="4" fill="none"/>
                    <rect x="70" y="140" width="60" height="40" rx="10" fill="#1a5f5d" opacity="0.6"/>
                  </svg>
                </div>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box className="doctor-content fade-right">
                <Typography variant="h3" className="doctor-title">Meet Dr. Ophelia</Typography>
                <Typography variant="h5" className="doctor-subtitle">Lead Dentist & Founder</Typography>
                <Typography variant="body1" className="doctor-text">
                  Dr. Ophelia brings years of dedicated experience and a genuine passion for dentistry. 
                  She believes that the best dental care comes from understanding each patient's unique story.
                </Typography>
                <Typography variant="body1" className="doctor-text">
                  "I chose dentistry because I wanted to make a difference. There's nothing more rewarding 
                  than seeing a patient leave with a confident smile. At Barnabas Dental, we're not just 
                  treating teeth – we're caring for people."
                </Typography>
                <Typography variant="body1" className="doctor-text">
                  Dr. Ophelia stays current with the latest advancements in dentistry, ensuring her patients 
                  receive the most effective, comfortable treatments available. Her gentle approach and 
                  attention to detail have made her a trusted name in the community.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Our Approach Section */}
      <Box className="section approach-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title fade-up">
            Our Approach to Dental Care
          </Typography>
          <Box className="approach-content">
            <Typography variant="body1" className="approach-text fade-left">
              We believe in patient education. We'll take the time to explain your treatment options, 
              answer your questions, and involve you in decisions about your care. No pressure, no 
              judgment – just honest, transparent communication.
            </Typography>
            <Typography variant="body1" className="approach-text fade-right">
              Modern technology is at the core of what we do. From digital X-rays that reduce radiation 
              exposure to comfortable treatment techniques that minimize discomfort, we've invested in 
              tools that make your visit better.
            </Typography>
            <Typography variant="body1" className="approach-text fade-left">
              Prevention is key. We focus on helping you maintain optimal oral health through regular 
              check-ups, cleanings, and personalized home care guidance. Your healthy smile is our 
              greatest reward.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* What Sets Us Apart Section */}
      <Box className="section difference-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title fade-up">
            What Sets Us Apart
          </Typography>
          <Box className="difference-grid">
            <Box className="difference-item fade-left">
              <Typography variant="h5" className="difference-title">Personalized Care</Typography>
              <Typography className="difference-text">Every treatment plan is tailored to your unique needs, goals, and budget.</Typography>
            </Box>
            <Box className="difference-item fade-right">
              <Typography variant="h5" className="difference-title">Comfort First</Typography>
              <Typography className="difference-text">From cozy treatment rooms to gentle techniques, we prioritize your comfort.</Typography>
            </Box>
            <Box className="difference-item fade-left">
              <Typography variant="h5" className="difference-title">Modern Technology</Typography>
              <Typography className="difference-text">Advanced equipment for more accurate diagnoses and efficient treatments.</Typography>
            </Box>
            <Box className="difference-item fade-right">
              <Typography variant="h5" className="difference-title">Transparent Pricing</Typography>
              <Typography className="difference-text">Clear communication about costs and flexible payment options available.</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box className="cta-section">
        <Container maxWidth="lg">
          <Typography variant="h4" className="cta-title fade-up">Ready to Experience the Barnabas Difference?</Typography>
          <Typography variant="body1" className="cta-subtitle fade-up">
            Schedule your appointment today and discover compassionate dental care.
          </Typography>
          <Button 
            variant="contained" 
            className="cta-button pulse-animation"
            onClick={() => navigate('/calendar')}
            startIcon={<CalendarTodayIcon />}
          >
            Book Your Visit Today
          </Button>
        </Container>
      </Box>
    </>
  );
};

export default About;