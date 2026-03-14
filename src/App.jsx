import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import DataEntry from './pages/DataEntry';
import AdminDashboard from './pages/AdminDashboard';
import DailySummary from './pages/admin/DailySummary';
import {Analytics} from '@vercel/analytics/react';



import StaffDashboard from './pages/StaffDashboard';
import DataEdit from './pages/DataEdit'
import StaffReport from './pages/admin/StaffReport';
import AssignmentReport from './pages/admin/AssignmentReport';

//client
import ClientManagement from './pages/admin/ClientManagement';
import AddClientPage from './pages/admin/ClientManagement/AddClientPage';
import DeleteClient from './pages/admin/ClientManagement/DeleteClient';
import EditClient from './pages/admin/ClientManagement/EditClient';

//staff 
import StaffManagement from './pages/admin/StaffManagement';
import AddStaff from './pages/admin/StaffManagement/AddStaff';
import DeleteStaff from './pages/admin/StaffManagement/DeleteStaff';
import EditStaff from './pages/admin/StaffManagement/EditStaff';

//assignment
import AssignmentManagement from './pages/admin/AssignmentManagement';
import AddAssignment from './pages/admin/AssignmentManagement/AddAssignment';
import DeleteAssignment from './pages/admin/AssignmentManagement/DeleteAssignment';
import EditAssignment from './pages/admin/AssignmentManagement/EditAssignment';


//added to do something to vercel cache
const App=()=> {
  return (
    <>
      <Analytics />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn/>}/>
        <Route path="/dataentry" element={<DataEntry/>}/>
        <Route path="/staffdashboard" element={<StaffDashboard/>}/>
        <Route path="/dataedit" element={<DataEdit/>}/>

        {/*Admin*/}
        <Route path="/admin/StaffReport" element={<StaffReport/>}/>"
        <Route path="/admin/AssignmentReport" element={<AssignmentReport/>}/>"
        <Route path="/admindash" element={<AdminDashboard/>}/>
        <Route path="/admin/DailySummary" element={<DailySummary/>}/>
        

        {/*Staff*/}
        <Route path="/admin/StaffManagement" element={<StaffManagement/>}/>"
        <Route path="/admin/StaffManagement/AddStaff" element={<AddStaff/>}/>"
        <Route path="/admin/StaffManagement/DeleteStaff" element={<DeleteStaff/>}/>"
        <Route path="/admin/StaffManagement/EditStaff" element={<EditStaff/>}/>"

        {/*Client*/}
        <Route path="/admin/ClientManagement" element={<ClientManagement/>}/>"
        <Route path="/admin/ClientManagement/AddClientPage" element={<AddClientPage/>}/>
        <Route path="/admin/ClientManagement/DeleteClient" element={<DeleteClient/>}/>"
        <Route path="/admin/ClientManagement/EditClient" element={<EditClient/>}/>" 

        {/*Assignment*/}
        <Route path="/admin/AssignmentManagement" element={<AssignmentManagement/>}/>"
        <Route path="/admin/AssignmentManagement/AddAssignment" element={<AddAssignment/>}/>"
        <Route path="/admin/AssignmentManagement/DeleteAssignment" element={<DeleteAssignment/>}/>"
        <Route path="/admin/AssignmentManagement/EditAssignment" element={<EditAssignment/>}/>"

        
       
        
        
      </Routes>
    </BrowserRouter>
  </>
  );
}

export default App;