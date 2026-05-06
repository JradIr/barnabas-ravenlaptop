// About.jsx
import React, { useState, useEffect } from "react";
import { Container, Grid, Button, Box } from "@mui/material";
import "./style/About.css";

export default function AboutLogin() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Scroll animations
      const elements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight - 100 && rect.bottom > 50) {
          el.classList.add('visible');
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero-section">
        <div className="about-hero-content">
          <h1 className="about-hero-title">About Barnabas Dental Clinic</h1>
          <p className="about-hero-subtitle">
            "Son of Encouragement" — Compassionate Care Since 2006
          </p>
          <Button className="hero-cta-button" href="#story">
            Read Our Story
          </Button>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="section intro-section" id="story">
        <Container maxWidth="lg">
          <div className="intro-content fade-up">
            <p className="intro-text">
              Founded in 2006, Barnabas Dental Clinic was built on a vision of delivering exceptional 
              dental care grounded in compassion, integrity, and dedication. Its founder began her 
              journey immediately after earning her dental license, gaining valuable experience in 
              established clinics while steadily nurturing the dream of creating a practice of her own.
            </p>
          </div>
        </Container>
      </div>

      {/* Journey Timeline Section */}
      <div className="section">
        <Container maxWidth="lg">
          <h2 className="section-title">Our Journey</h2>
          <p className="section-subtitle">
            A story of perseverance, growth, and unwavering commitment to excellence
          </p>
          
          <Grid container spacing={4} className="timeline-grid">
            <Grid item xs={12} md={6}>
              <div className="timeline-card fade-left">
                <div className="timeline-year">2006</div>
                <h3 className="timeline-title">The Beginning</h3>
                <p className="timeline-text">
                  Barnabas Dental Clinic was founded with a vision of delivering exceptional dental care 
                  grounded in compassion, integrity, and dedication. The founder began her journey immediately 
                  after earning her dental license, gaining valuable experience in established clinics while 
                  nurturing the dream of creating her own practice.
                </p>
              </div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <div className="timeline-card fade-right">
                <div className="timeline-year">Early Days</div>
                <h3 className="timeline-title">Humble Beginnings</h3>
                <p className="timeline-text">
                  The clinic operated on modest beginnings—starting with basic equipment in a small boarding 
                  house, where friends and colleagues became its first patients. Despite limited resources, 
                  the founder's commitment to excellence remained unwavering. She balanced multiple roles 
                  across respected institutions in Pasig, Santa Lucia, Camp Aguinaldo, and St. Camillus in Cainta.
                </p>
              </div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <div className="timeline-card fade-left">
                <div className="timeline-year">2009</div>
                <h3 className="timeline-title">Turning Point</h3>
                <p className="timeline-text">
                  A pivotal moment came after Typhoon Ondoy, when she acquired her first dental chair and 
                  transitioned into a small clinic space in Cainta. In 2012, Barnabas Dental Clinic was 
                  formally registered, marking the start of its growth as a dedicated private practice.
                </p>
              </div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <div className="timeline-card fade-right">
                <div className="timeline-year">2016</div>
                <h3 className="timeline-title">Full Commitment</h3>
                <p className="timeline-text">
                  With the steadfast support of her husband and family, the founder made the defining decision 
                  to focus fully on the clinic. This allowed the practice to evolve into a more advanced, 
                  well-equipped facility that prioritizes both clinical excellence and patient comfort.
                </p>
              </div>
            </Grid>
          </Grid>
        </Container>
      </div>

      {/* Philosophy Section */}
      <div className="section philosophy-section">
        <Container maxWidth="lg">
          <div className="philosophy-content scale-in">
            <div className="philosophy-icon">💚</div>
            <h2 className="philosophy-title">The Meaning of Barnabas</h2>
            <p className="philosophy-text">
              The name "Barnabas," meaning <strong>"son of encouragement,"</strong> reflects the clinic's core philosophy: 
              to provide not only high-quality dental services but also a reassuring and supportive experience 
              for every patient.
            </p>
            <p className="philosophy-quote">
              "Nearly two decades since its founding, Barnabas Dental Clinic continues to uphold its commitment 
              to professionalism, innovation, and compassionate service—serving generations of patients."
            </p>
          </div>
        </Container>
      </div>

      {/* Vision & Mission Section */}
      <div className="section vision-mission-section">
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <div className="vision-card fade-left">
                <div className="card-icon">👁️</div>
                <h2>Vision</h2>
                <p>
                  To be a private dental clinic recognized for delivering excellent, patient-centered care 
                  and creating confident, healthy smiles in the community.
                </p>
              </div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <div className="mission-card fade-right">
                <div className="card-icon">🎯</div>
                <h2>Mission</h2>
                <p>
                  To provide quality and affordable dental services through skilled professionals, modern 
                  technology, and compassionate care. We are committed to promoting oral health, ensuring 
                  patient comfort, and building lasting relationships based on trust and integrity.
                </p>
              </div>
            </Grid>
          </Grid>
        </Container>
      </div>

      {/* Values Section */}
      <div className="section values-section">
        <Container maxWidth="lg">
          <h2 className="section-title">Our Core Values</h2>
          <p className="section-subtitle">
            The principles that guide everything we do
          </p>
          
          <Grid container spacing={3}>
            {[
              { num: "01", title: "Compassion", text: "We treat every patient with genuine care, empathy, and understanding, ensuring a comfortable experience." },
              { num: "02", title: "Excellence", text: "We strive for the highest standards in dental care, continuously improving our skills and technology." },
              { num: "03", title: "Integrity", text: "We operate with honesty, transparency, and ethical practices in all our interactions." },
              { num: "04", title: "Innovation", text: "We embrace modern techniques and technologies to provide the best possible outcomes." },
              { num: "05", title: "Community", text: "We are committed to serving and improving oral health in our local community." },
              { num: "06", title: "Trust", text: "We build lasting relationships based on reliability, consistency, and mutual respect." }
            ].map((value, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <div className="value-card scale-in">
                  <div className="value-number">{value.num}</div>
                  <h3 className="value-title">{value.title}</h3>
                  <p className="value-text">{value.text}</p>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </div>

      {/* Today Section */}
      <div className="section today-section">
        <Container maxWidth="lg">
          <div className="today-content fade-up">
            <h2 className="today-title">Barnabas Dental Clinic Today</h2>
            <p className="today-text">
              Today, nearly two decades since its founding, Barnabas Dental Clinic has evolved into a 
              modern, well-equipped facility that serves generations of patients. Under the continued 
              leadership of its founder, the clinic remains dedicated to its founding principles of 
              compassion, excellence, and integrity.
            </p>
            <div className="today-stats">
              <div className="stat-item">
                <div className="stat-number">18+</div>
                <div className="stat-label">Years of Service</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Happy Patients</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Emergency Support</div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <Container maxWidth="lg">
          <h2 className="cta-title">Experience the Barnabas Difference</h2>
          <p className="cta-text">
            Schedule your appointment today and discover compassionate, excellent dental care.
          </p>
          <Button className="cta-button pulse-animation">
            Book an Appointment
          </Button>
        </Container>
      </div>

      {/* Scroll to Top Button */}
      <Button 
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
      >
        ↑
      </Button>
    </div>
  );
}