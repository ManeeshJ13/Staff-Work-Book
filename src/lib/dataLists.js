
export const financialYears = [
    "2022-2023",
    "2023-2024", 
    "2024-2025"
  ];
  
  export const completionStatus = [
    "yes",
    "no",
    "partial"
  ];

  
export const addItem = (listName, newItem) => {
    const list = { clientList, assignmentList }[listName];
    if (list && !list.includes(newItem)) {
      list.push(newItem);
      list.sort((a, b) => a.localeCompare(b));
      return true;
    }
    return false;
  };