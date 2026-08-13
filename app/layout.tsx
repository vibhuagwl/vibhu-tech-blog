import type {Metadata} from 'next';
import {Source_Sans_3,IBM_Plex_Mono} from 'next/font/google';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import './globals.css';

const sans=Source_Sans_3({
  subsets:['latin'],
  variable:'--font-source-sans',
  display:'swap',
});

const mono=IBM_Plex_Mono({
  subsets:['latin'],
  weight:['400','500','600'],
  variable:'--font-ibm-mono',
  display:'swap',
});

export const metadata:Metadata={
  title:{default:'Vibhu Tech Lab — Senior Engineering Interview Hub',template:'%s · Vibhu Tech Lab'},
  description:'Vibhu Tech Lab: engineering knowledge for senior developers — Java, Spring Boot, microservices, Kafka, system design, and production troubleshooting with interview-ready answers.',
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
