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
};

const themeBoot=`(()=>{try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:themeBoot}}/>
      </head>
      <body className="font-sans antialiased">
        <SiteHeader/>
        {children}
        <SiteFooter/>
      </body>
    </html>
  );
}
