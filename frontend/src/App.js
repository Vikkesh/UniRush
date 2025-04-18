import AppRoutes from "./AppRoutes";
import Header from "./components/Header/Header";
import Loading from "./components/Loading/Loading";
import { useLoading } from "./hooks/useLoading";
import {setLoadingInterceptor} from "./interceptors/loadinginterceptor";
import { useEffect } from "react";
import axios from "axios";

function App() {
  const { showLoading, hideLoading } = useLoading();
  
  useEffect(() => {
    setLoadingInterceptor({ showLoading, hideLoading });
    
    // Set CSS variable for background image with the correct base URL
    const root = document.documentElement;
    const baseUrl = process.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '';
    root.style.setProperty('--bg-image-url', `url('${baseUrl}/Background/Background_White.webp')`);
  }, [hideLoading, showLoading]);

  return (
    <>
    <Loading/>
    <Header/>
    <AppRoutes/>
    </>
   
  );
}

export default App;
