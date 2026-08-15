import type {Metadata} from 'next';
import {Manrope,IBM_Plex_Mono} from 'next/font/google';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import './globals.css';

const sans=Manrope({
  subsets:['latin'],
  variable:'--font-manrope',
  display:'swap',
});

const mono=IBM_Plex_Mono({
  subsets:['latin'],
  weight:['400','500','600'],
  variable:'--font-ibm-mono',
  display:'swap',
});

export const metadata:Metadata={
  title:{default:'Vibhu Architect — Senior Engineering Interview Hub',template:'%s · Vibhu Architect'},
  description:
    'Vibhu Architect: professional interview preparation for Senior, Staff, and Principal engineers — Java, Spring Boot, microservices, Kafka, AWS, system design, and production engineering.',
  metadataBase:new URL('https://vibhuagwl.github.io/vibhu-tech-blog'),
  openGraph:{
    title:'Vibhu Architect — Senior Engineering Interview Hub',
    description:
      'Professional interview preparation for Senior, Staff, and Principal engineers — Java, Spring Boot, microservices, Kafka, AWS, system design, and production engineering.',
    url:'https://vibhuagwl.github.io/vibhu-tech-blog',
    siteName:'Vibhu Architect',
    type:'website',
  },
  twitter:{
    card:'summary_large_image',
    title:'Vibhu Architect — Senior Engineering Interview Hub',
    description:
      'Professional interview preparation for Senior, Staff, and Principal engineers — Java, Spring Boot, microservices, Kafka, and system design.',
  },
  alternates:{
    canonical:'/',
  },
};

const themeBoot=`(()=>{try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

const orgJsonLd={
  '@context':'https://schema.org',
  '@type':'WebSite',
  name:'Vibhu Architect',
  url:'https://vibhuagwl.github.io/vibhu-tech-blog',
  description:
    'Professional interview preparation for Senior, Staff, and Principal engineers — Java, Spring Boot, microservices, Kafka, AWS, system design, and production engineering.',
  author:{
    '@type':'Person',
    name:'Vibhu Agarwal',
    url:'https://www.linkedin.com/in/vibhuagwl/',
  },
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:themeBoot}}/>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html:JSON.stringify(orgJsonLd)}}
        />
      </head>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader/>
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
        <SiteFooter/>
      </body>
    </html>
  );
}
