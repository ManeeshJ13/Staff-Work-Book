
export const financialYears = [
    "2022-23",
    "2023-24", 
    "2024-25",
    "2025-26"
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