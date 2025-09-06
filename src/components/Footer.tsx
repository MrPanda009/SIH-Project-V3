import React from 'react'

export default function Footer() {
  const handleContactSupport = () => {
    window.location.href = 'tel:+91-141-999-3456'
  }

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between py-3">
          {/* Left: Contact Support */}
          <button
            onClick={handleContactSupport}
            className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Contact Support
          </button>
          
          {/* Center: Platform Name */}
          <div className="text-sm text-muted-foreground text-center">
            Civic Issue Reporting Platform
          </div>
          
          {/* Right: Address */}
          <div className="text-sm text-muted-foreground text-right">
            Manipal University Jaipur, Dahmi Kalan, 303007
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden py-3 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleContactSupport}
              className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              Contact Support
            </button>
            <div className="text-sm text-muted-foreground">
              Sannadhaan Setu - A Civic Issue Reporting Platform
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Manipal University Jaipur, Dahmi Kalan, 303007
          </div>
        </div>
      </div>
    </footer>
  )
}
