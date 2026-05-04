// src/components/Services.jsx

import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Button, Fab, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BrushIcon from "@mui/icons-material/Brush";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import StarIcon from "@mui/icons-material/Star";
import SpeedIcon from "@mui/icons-material/Speed";
import PeopleIcon from "@mui/icons-material/People";
import "./style/Services.css";

const Services = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const elements = document.querySelectorAll(".fade-up, .fade-left, .fade-right, .scale-in");
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 80 && elementBottom > 80) {
          element.classList.add("visible");
        } else {
          element.classList.remove("visible");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const servicesList = [
    {
      icon: <BrushIcon />,
      title: "Routine Check-ups & Cleaning",
      description: "Regular examinations and professional cleaning to maintain optimal oral health.",
    },
    {
      icon: <EmojiEmotionsIcon />,
      title: "Cosmetic Dentistry",
      description: "Whitening, veneers, and smile makeovers to boost your confidence.",
    },
    {
      icon: <LocalHospitalIcon />,
      title: "Orthodontics",
      description: "Braces and clear aligners for a perfectly aligned smile.",
    },
    {
      icon: <CheckCircleIcon />,
      title: "Restorative Dentistry",
      description: "Fillings, crowns, and bridges to restore damaged teeth.",
    },
    {
      icon: <SpeedIcon />,
      title: "Oral Surgery & Extractions",
      description: "Safe and comfortable surgical procedures when needed.",
    },
    {
      icon: <PeopleIcon />,
      title: "Pediatric Dentistry",
      description: "Gentle, child-friendly care for healthy developing smiles.",
    }
  ];

  const detailedServices = [
    {
      title: "Preventive Care",
      description: "Regular check-ups, professional cleanings, fluoride treatments, and dental sealants to prevent cavities and maintain optimal oral health."
    },
    {
      title: "Cosmetic Procedures",
      description: "Teeth whitening, porcelain veneers, dental bonding, and complete smile makeovers to enhance your natural beauty."
    },
    {
      title: "Restorative Solutions",
      description: "Dental fillings, crowns, bridges, dentures, and dental implants to restore function and aesthetics."
    },
    {
      title: "Orthodontic Care",
      description: "Traditional braces and clear aligner therapy for straightening teeth and correcting bite issues."
    }
  ];

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
      <Box className="services-hero-section">
        <Container maxWidth="lg">
          <Box className="services-hero-content">
            <Typography variant="h1" className="services-hero-title fade-up">
              Our Services
            </Typography>
            <Typography variant="h5" className="services-hero-subtitle fade-up">
              Comprehensive dental care tailored to your unique needs
            </Typography>
            <Button 
              variant="contained" 
              className="hero-cta-button fade-up"
              onClick={() => navigate('/calendar')}
              startIcon={<CalendarTodayIcon />}
            >
              Book an Appointment
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Introduction Section */}
      <Box className="section intro-section">
        <Container maxWidth="lg">
          <Box className="intro-content">
            <Typography variant="body1" className="intro-text fade-up">
              At Barnabas Dental Clinic, we offer a wide range of treatments to keep your smile healthy and bright. 
              Our services are designed to meet the needs of patients of all ages, combining modern technology with 
              compassionate care.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Services Grid Section */}
      <Box className="section services-grid-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title fade-up">
            What We Offer
          </Typography>
          <Typography variant="body1" className="section-subtitle fade-up">
            Explore our comprehensive range of dental services
          </Typography>
          <Grid container spacing={4} className="services-grid">
            {servicesList.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box 
                  className="service-item fade-up" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="service-icon-wrapper">
                    {service.icon}
                  </div>
                  <Typography variant="h5" className="service-item-title">
                    {service.title}
                  </Typography>
                  <Typography className="service-item-description">
                    {service.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Detailed Services Section */}
      <Box className="section detailed-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title fade-up">
            Detailed Treatment Options
          </Typography>
          <Grid container spacing={3} className="detailed-grid">
            {detailedServices.map((service, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box className={`detailed-card ${index % 2 === 0 ? 'fade-left' : 'fade-right'}`}>
                  <Typography variant="h5" className="detailed-title">{service.title}</Typography>
                  <Typography className="detailed-text">{service.description}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Box className="section why-section">
        <Container maxWidth="lg">
          <Typography variant="h3" className="section-title fade-up">
            Why Choose Our Services?
          </Typography>
          <Grid container spacing={4} className="why-grid">
            <Grid item xs={12} sm={6} md={3}>
              <Box className="why-card fade-up">
                <div className="why-number">01</div>
                <Typography variant="h6" className="why-title">Modern Technology</Typography>
                <Typography className="why-text">State-of-the-art equipment for precise, comfortable treatments</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box className="why-card fade-up">
                <div className="why-number">02</div>
                <Typography variant="h6" className="why-title">Experienced Team</Typography>
                <Typography className="why-text">Skilled professionals dedicated to your comfort and care</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box className="why-card fade-up">
                <div className="why-number">03</div>
                <Typography variant="h6" className="why-title">Personalized Care</Typography>
                <Typography className="why-text">Treatment plans tailored to your unique needs and goals</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box className="why-card fade-up">
                <div className="why-number">04</div>
                <Typography variant="h6" className="why-title">Affordable Options</Typography>
                <Typography className="why-text">Flexible payment plans and insurance assistance available</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box className="cta-section">
        <Container maxWidth="lg">
          <Typography variant="h4" className="cta-title fade-up">
            Ready to Transform Your Smile?
          </Typography>
          <Typography variant="body1" className="cta-text fade-up">
            Schedule your consultation today and discover the Barnabas Dental difference.
          </Typography>
          <Button 
            variant="contained" 
            className="cta-button pulse-animation fade-up"
            onClick={() => navigate('/calendar')}
            startIcon={<CalendarTodayIcon />}
          >
            Book Your Appointment
          </Button>
        </Container>
      </Box>
    </>
  );
};

export default Services;