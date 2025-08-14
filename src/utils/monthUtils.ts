export const generateFutureMonths = () => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 13; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
    months.push(monthKey);
  }
  
  return months;
};

export const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
};