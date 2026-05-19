const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getINP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      if (typeof getINP === 'function') {
        getINP(onPerfEntry);
      } else {
        getFID(onPerfEntry);
      }
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
