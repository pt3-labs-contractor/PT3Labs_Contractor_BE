import React from 'react'
import { NavLink } from 'react-router-dom'

import './MainNavbar.css'

export default function MainNavbar() {
  return (
    <div>
       <header className="main-navbar">
        <div className="main-navbar-logo">
            <h1>Digital Contractor</h1>
        </div>
        <nav className="main-navbar-items">
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/services">Services</NavLink></li> 
            <li><NavLink to="/reviews">Reviews</NavLink></li> 
            <li><NavLink to="/pricing">Pricing</NavLink></li> 
            <li><NavLink to="/login">Login</NavLink></li>
            <li><NavLink to="/register">Register</NavLink></li>  
          </ul>
        </nav>
      </header>
    </div>
  )
}
