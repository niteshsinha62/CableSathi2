// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA0BBrvVfbg13i5BDyFgS4_IapoHYhbEks",
    authDomain: "cableworktracker.firebaseapp.com",
    projectId: "cableworktracker",
    storageBucket: "cableworktracker.appspot.com",
    messagingSenderId: "363803214900",
    appId: "1:363803214900:web:d65d39ec958a31e7533661"
};
const ADMIN_UID = "6suqqzr9j8gCUqEAHk4jEA1x1AA2";

// --- Cloudinary Configuration ---
const CLOUDINARY_CLOUD_NAME = "dzcvp4zor";
const CLOUDINARY_UPLOAD_PRESET = "cable-tracker-preset";

// --- Firebase Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const loginView = document.getElementById('login-view'),
      staffView = document.getElementById('staff-view'),
      adminContainer = document.getElementById('admin-container'),
      dashboardView = document.getElementById('dashboard-view'),
      mapView = document.getElementById('map-view'),
      analyticsView = document.getElementById('analytics-view'),
      loginBtn = document.getElementById('login-btn'),
      emailInput = document.getElementById('email'),
      passwordInput = document.getElementById('password'),
      loginError = document.getElementById('login-error'),
      submitJobBtn = document.getElementById('submit-job-btn'),
      cancelJobBtn = document.getElementById('cancel-job-btn'),
      jobList = document.getElementById('job-list'),
      dashboardTableBody = document.getElementById('dashboard-table-body'),
      searchInput = document.getElementById('search-input'),
      photoInput = document.getElementById('photo'),
      imagePreviewContainer = document.getElementById('image-preview-container'),
      staffNameInput = document.getElementById('staff-name'),
      jobTypeInput = document.getElementById('job-type'),
      serviceAreaInput = document.getElementById('service-area'),
      landmarkInput = document.getElementById('landmark'),
      junctionAddressContainer = document.getElementById('junction-address-container'),
      junctionAddressInput = document.getElementById('junction-address'),
      jobNotesInput = document.getElementById('job-notes'),
      areaFilterInput = document.getElementById('area-filter'),
      landmarkFilterInput = document.getElementById('landmark-filter'),
      jobTypeFilterInput = document.getElementById('job-type-filter'),
      staffNameFilterInput = document.getElementById('staff-name-filter'),
      mapAreaFilter = document.getElementById('map-area-filter'),
      mapLandmarkFilter = document.getElementById('map-landmark-filter'),
      mapCustomerTypeFilter = document.getElementById('map-customer-type-filter'),
      mapSearchInput = document.getElementById('map-search-input'),
      mapListInfo = document.getElementById('map-list-info'),
      openCameraBtn = document.getElementById('open-camera-btn'),
      cameraView = document.getElementById('camera-view'),
      cameraStream = document.getElementById('camera-stream'),
      cameraCanvas = document.getElementById('camera-canvas'),
      captureBtn = document.getElementById('capture-btn'),
      cancelCameraBtn = document.getElementById('cancel-camera-btn'),
      langSwitcherStaff = document.getElementById('language-switcher-staff'),
      viewMapBtn = document.getElementById('view-map-btn'),
      trackCustomerBtn = document.getElementById('track-customer-btn'),
      viewAnalyticsBtn = document.getElementById('view-analytics-btn'),
      backToDashboardBtn = document.getElementById('back-to-dashboard-btn'),
      backToDashboardBtn2 = document.getElementById('back-to-dashboard-btn2'),
      analyticsPeriod = document.getElementById('analytics-period'),
      analyticsAreaFilter = document.getElementById('analytics-area-filter'),
      analyticsResults = document.getElementById('analytics-results'),
      successModal = document.getElementById('success-modal'),
      okBtn = document.getElementById('ok-btn'),
      currentLocationBtn = document.getElementById('current-location-btn'),
      currentLocationBtnText = document.getElementById('current-location-btn-text'),
      currentLocationLoader = document.getElementById('current-location-loader'),
      locationSearchInput = document.getElementById('location-search-input'),
      locationSection = document.getElementById('location-section'),
      imageModal = document.getElementById('image-modal'),
      closeImageModal = document.getElementById('close-image-modal'),
      modalImage = document.getElementById('modal-image'),
      prevImageBtn = document.getElementById('prev-image-btn'),
      nextImageBtn = document.getElementById('next-image-btn'),
      downloadImageBtn = document.getElementById('download-image-btn'),
      customDateRange = document.getElementById('custom-date-range'),
      startDateInput = document.getElementById('start-date'),
      endDateInput = document.getElementById('end-date'),
      exportMenuBtn = document.getElementById('export-menu-btn'),
      exportOptions = document.getElementById('export-options'),
      exportExcelBtn = document.getElementById('export-excel-btn'),
      exportPdfBtn = document.getElementById('export-pdf-btn'),
      deleteModal = document.getElementById('delete-modal'),
      cancelDeleteBtn = document.getElementById('cancel-delete-btn'),
      confirmDeleteBtn = document.getElementById('confirm-delete-btn'),
      deleteBtnText = document.getElementById('delete-btn-text'),
      deleteBtnLoader = document.getElementById('delete-btn-loader'),
      updateModal = document.getElementById('update-modal'),
      cancelUpdateBtn = document.getElementById('cancel-update-btn'),
      confirmUpdateBtn = document.getElementById('confirm-update-btn'),
      updateBtnText = document.getElementById('update-btn-text'),
      updateBtnLoader = document.getElementById('update-btn-loader'),
      dashboardPeriod = document.getElementById('dashboard-period'),
      dashboardCustomDateRange = document.getElementById('dashboard-custom-date-range'),
      dashboardStartDate = document.getElementById('dashboard-start-date'),
      dashboardEndDate = document.getElementById('dashboard-end-date'),
      manageStaffBtn = document.getElementById('manage-staff-btn'),
      manageStaffView = document.getElementById('manage-staff-view'),
      newStaffNameInput = document.getElementById('new-staff-name-input'),
      newStaffMobileInput = document.getElementById('new-staff-mobile-input'),
      openAddStaffModalBtn = document.getElementById('open-add-staff-modal-btn'),
      staffStatsTableBody = document.getElementById('staff-stats-table-body'),
      backToDashboardBtn3 = document.getElementById('back-to-dashboard-btn3'),
      addStaffError = document.getElementById('add-staff-error'),
      addStaffModal = document.getElementById('add-staff-modal'),
      cancelAddStaffBtn = document.getElementById('cancel-add-staff-btn'),
      confirmAddStaffBtn = document.getElementById('confirm-add-staff-btn'),
      addStaffBtnText = document.getElementById('add-staff-btn-text'),
      addStaffBtnLoader = document.getElementById('add-staff-btn-loader'),
      deleteStaffModal = document.getElementById('delete-staff-modal'),
      cancelDeleteStaffBtn = document.getElementById('cancel-delete-staff-btn'),
      confirmDeleteStaffBtn = document.getElementById('confirm-delete-staff-btn'),
      deleteStaffBtnText = document.getElementById('delete-staff-btn-text'),
      deleteStaffBtnLoader = document.getElementById('delete-staff-btn-loader'),
      staffPerfPeriod = document.getElementById('staff-perf-period'),
      staffPerfCustomDateRange = document.getElementById('staff-perf-custom-date-range'),
      staffPerfStartDate = document.getElementById('staff-perf-start-date'),
      staffPerfEndDate = document.getElementById('staff-perf-end-date'),
      // LEAVE MANAGEMENT ELEMENTS
      leaveModal = document.getElementById('leave-modal'),
      leaveModalTitle = document.getElementById('leave-modal-title'),
      closeLeaveModalBtn = document.getElementById('close-leave-modal-btn'),
      leaveCalendarContainer = document.getElementById('leave-calendar-container'),
      cancelLeavesBtn = document.getElementById('cancel-leaves-btn'),
      saveLeavesBtn = document.getElementById('save-leaves-btn'),
      saveLeavesBtnText = document.getElementById('save-leaves-btn-text'),
      saveLeavesBtnLoader = document.getElementById('save-leaves-btn-loader'),
      leaveDatesModal = document.getElementById('leave-dates-modal'),
      leaveDatesModalTitle = document.getElementById('leave-dates-modal-title'),
      closeLeaveDatesModalBtn = document.getElementById('close-leave-dates-modal-btn'),
      leaveDatesListContainer = document.getElementById('leave-dates-list-container'),
      okLeaveDatesBtn = document.getElementById('ok-leave-dates-btn'),
      // CUSTOMER VIEW ELEMENTS
      customerView = document.getElementById('customer-view'),
      addCustomerBtn = document.getElementById('add-customer-btn'),
      cancelCustomerBtn = document.getElementById('cancel-customer-btn'),
      submitCustomerBtn = document.getElementById('submit-customer-btn'),
      customerViewTitle = document.getElementById('customer-view-title'),
      submitCustomerText = document.getElementById('submit-customer-text'),
      customerStaffNameInput = document.getElementById('customer-staff-name'),
      customerNameInput = document.getElementById('customer-name'),
      customerMobileInput = document.getElementById('customer-mobile'),
      customerTypeInput = document.getElementById('customer-type'),
      customerServiceAreaInput = document.getElementById('customer-service-area'),
      customerLandmarkInput = document.getElementById('customer-landmark'),
      customerLocationSearchInput = document.getElementById('customer-location-search-input'),
      customerNotesInput = document.getElementById('customer-notes'),
      customerPhotoInput = document.getElementById('customer-photo'),
      customerOpenCameraBtn = document.getElementById('customer-open-camera-btn'),
      customerImagePreviewContainer = document.getElementById('customer-image-preview-container'),
      customerCurrentLocationBtn = document.getElementById('customer-current-location-btn'),
      customerCameraView = document.getElementById('customer-camera-view'),
      customerCameraStream = document.getElementById('customer-camera-stream'),
      customerCameraCanvas = document.getElementById('customer-camera-canvas'),
      customerCaptureBtn = document.getElementById('customer-capture-btn'),
      customerCancelCameraBtn = document.getElementById('customer-cancel-camera-btn'),
      // AREA CONFIGURATION ELEMENTS
      configAreaBtn = document.getElementById('config-area-btn'),
      areaConfigModal = document.getElementById('area-config-modal'),
      closeAreaConfigModalBtn = document.getElementById('close-area-config-modal-btn'),
      newAreaNameInput = document.getElementById('new-area-name-input'),
      addAreaBtn = document.getElementById('add-area-btn'),
      areaConfigSelect = document.getElementById('area-config-select'),
      landmarkEditorContainer = document.getElementById('landmark-editor-container'),
      deleteAreaBtn = document.getElementById('delete-area-btn'),
      landmarkListEditor = document.getElementById('landmark-list-editor'),
      newLandmarkInput = document.getElementById('new-landmark-input'),
      addLandmarkBtn = document.getElementById('add-landmark-btn'),
      saveAreaChangesBtn = document.getElementById('save-area-changes-btn');


// --- State Variables ---
let googleMap, currentInfoWindow = null, markers = [];
let staffMap, staffMarker;
let customerMap, customerMarker, customerSelectedLocation = null, customerFilesToUpload = [];
let allJobs = [], currentFilteredJobs = [], currentStream = null, filesToUpload = [],
    selectedLocation = null, currentSort = { key: 'timestamp', dir: 'desc' },
    modalImages = [], currentModalImageIndex = 0, isInitialLoad = true,
    jobToDelete = null, staffViewInitialized = false, customerViewInitialized = false,
    jobToEdit = null, isEditMode = false,
    allStaff = [], staffToDeleteId = null, staffToEditId = null,
    staffForLeaveMgmt = null, tempLeaveDates = [], calendarDate = new Date(),
    allServiceAreas = [],
    // State for Area Config Modal
    selectedAreaForEditing = null,
    editedLandmarks = [];


// --- Language Translations ---
const translations = {
    en: {
        loginTitle: "Cable Operations Portal", email: "Email", password: "Password", login: "Login",
        recordJobActivity: "Record Job Activity", logout: "Logout", jobType: "Job Type",
        selectJobType: "Select a job type...", installation: "Installation", maintenance: "Maintenance",
        repair: "Repair", serviceArea: "Service Area", selectServiceArea: "Select a service area...",
        cableJunctionAddressLabel: "Cable Junction Address", junctionAddressPlaceholder: "e.g., House #123, Near Water Tank",
        customerDetailsLabel: "Customer Details / Job Notes", customerDetailsPlaceholder: "Enter customer details and job notes...",
        attachments: "Attachments", uploadPhoto: "Upload Photo", takePhoto: "Take Photo",
        capturePhoto: "Capture Photo", cancel: "Cancel", submit: "Submit", update: "Update",
        jobList: "Job List", allAreas: "All Areas", searchPlaceholder: "Search by address, staff, notes...",
        navigate: "Navigate", shareLocation: "Share Location", sharePhoto: "Share Photo",
        copied: "Copied!", noAddress: "No Address", noMatchingJobs: "No matching jobs found.",
        successTitle: "Success!", successMessage: "Successfully logged your work.", newEntry: "New Entry",
        updateSuccessMessage: "Job record updated successfully.",
        staffNameLabel: "Name", staffNamePlaceholder: "Enter your full name", selectStaffName: "Select your name...",
        landmarkLabel: "Landmark", jobLocationLabel: "Job Location",
        jobLocationPlaceholder: "Search for a location...", useCurrentLocation: "Use Current Location",
    },
    hi: {
        loginTitle: "केबल संचालन पोर्टल", email: "ईमेल", password: "पासवर्ड", login: "लॉगिन",
        recordJobActivity: "जॉब गतिविधि रिकॉर्ड करें", logout: "लॉगआउट", jobType: "जॉब का प्रकार",
        selectJobType: "जॉब का प्रकार चुनें...", installation: "इंस्टॉलेशन", maintenance: "रखरखाव",
        repair: "मरम्मत", serviceArea: "सेवा क्षेत्र", selectServiceArea: "सेवा क्षेत्र चुनें...",
        cableJunctionAddressLabel: "केबल जंक्शन पता", junctionAddressPlaceholder: "उदा., घर #123, पानी की टंकी के पास",
        customerDetailsLabel: "ग्राहक विवरण / जॉब नोट्स", customerDetailsPlaceholder: "ग्राहक विवरण और जॉब नोट्स दर्ज करें...",
        attachments: "अटैचमेंट्स", uploadPhoto: "फोटो अपलोड करें", takePhoto: "फोटो लें",
        capturePhoto: "फोटो खींचे", cancel: "रद्द करें", submit: "सबमिट करें", update: "अपडेट करें",
        jobList: "जॉब सूची", allAreas: "सभी क्षेत्र", searchPlaceholder: "पता, कर्मचारी, नोट्स द्वारा खोजें...",
        navigate: "नेविगेट", shareLocation: "स्थान साझा करें", sharePhoto: "फोटो साझा करें",
        copied: "कॉपी किया गया!", noAddress: "कोई पता नहीं", noMatchingJobs: "कोई मेल खाने वाली नौकरी नहीं मिली।",
        successTitle: "सफलता!", successMessage: "आपका काम सफलतापूर्वक लॉग हो गया।", newEntry: "नई प्रविष्टि",
        updateSuccessMessage: "जॉब रिकॉर्ड सफलतापूर्वक अपडेट किया गया।",
        staffNameLabel: "नाम", staffNamePlaceholder: "अपना पूरा नाम दर्ज करें", selectStaffName: "अपना नाम चुनें...",
        landmarkLabel: "लैंडマーク", jobLocationLabel: "जॉब लोकेशन",
        jobLocationPlaceholder: "स्थान खोजें...", useCurrentLocation: "वर्तमान स्थान का उपयोग करें",
    }
};

function setLanguage(lang) {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder');
        if (translations[lang][key]) el.placeholder = translations[lang][key];
    });

    // Repopulate dynamic dropdowns if needed, preserving selection
    const selectedServiceArea = serviceAreaInput.value;
    populateAreaDropdown(serviceAreaInput);
    serviceAreaInput.value = selectedServiceArea;
    populateLandmarks(serviceAreaInput, landmarkInput);


    localStorage.setItem('language', lang);
    langSwitcherStaff.value = lang;
}

// --- Authentication & Page Routing ---
onAuthStateChanged(auth, user => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
    if (user) {
        listenForStaffMembers();
        listenForServiceAreas(); // Listen for areas for all logged-in users
        loginView.classList.add('hidden');
        if (user.uid === ADMIN_UID) {
            adminContainer.classList.remove('hidden');
            staffView.classList.add('hidden');
            customerView.classList.add('hidden');
            initAdminView();
        } else {
            staffView.classList.remove('hidden');
            adminContainer.classList.add('hidden');
            customerView.classList.add('hidden');
            junctionAddressContainer.classList.add('hidden'); // Hide for staff by default
            initStaffView(user);
        }
    } else {
        loginView.classList.remove('hidden');
        staffView.classList.add('hidden');
        adminContainer.classList.add('hidden');
        customerView.classList.add('hidden');
    }
});

function setupLogoutButtons() {
    document.getElementById('logout-btn-staff').addEventListener('click', () => {
        localStorage.setItem('language', 'en');
        signOut(auth);
    });
    document.getElementById('logout-btn-admin').addEventListener('click', () => {
        localStorage.setItem('language', 'en');
        signOut(auth);
    });
}

// --- Area & Landmark Configuration ---

function showSuccess(message) {
    document.getElementById('success-modal-title').textContent = "Success!";
    document.getElementById('success-modal-message').textContent = message;
    successModal.classList.remove('hidden');
}

async function handleAddServiceArea() {
    const newName = newAreaNameInput.value.trim();
    if (!newName) {
        alert("Area name cannot be empty.");
        return;
    }
    if (allServiceAreas.some(area => area.name.toLowerCase() === newName.toLowerCase())) {
        alert("This service area already exists.");
        return;
    }

    try {
        await addDoc(collection(db, "serviceAreas"), {
            name: newName,
            landmarks: [],
            timestamp: new Date()
        });
        newAreaNameInput.value = '';
        showSuccess(`Service area "${newName}" added successfully.`);
    } catch (error) {
        console.error("Error adding service area: ", error);
        alert("Failed to add service area.");
    }
}

async function handleDeleteSelectedArea() {
    if (!selectedAreaForEditing) {
        alert("No area selected.");
        return;
    }
    const areaName = selectedAreaForEditing.name;
    if (confirm(`Are you sure you want to delete the area "${areaName}" and all its landmarks? This action cannot be undone.`)) {
        try {
            await deleteDoc(doc(db, "serviceAreas", selectedAreaForEditing.id));
            landmarkEditorContainer.classList.add('hidden');
            selectedAreaForEditing = null;
            editedLandmarks = [];
            showSuccess(`Area "${areaName}" was deleted successfully.`);
        } catch (error) {
            console.error("Error deleting service area: ", error);
            alert("Failed to delete service area.");
        }
    }
}

async function handleSaveChanges() {
    if (!selectedAreaForEditing) {
        alert("Please select an area first.");
        return;
    }
    saveAreaChangesBtn.disabled = true;
    saveAreaChangesBtn.textContent = "Saving...";

    try {
        const areaRef = doc(db, "serviceAreas", selectedAreaForEditing.id);
        await updateDoc(areaRef, {
            landmarks: editedLandmarks
        });
        showSuccess(`Changes for "${selectedAreaForEditing.name}" saved successfully.`);
    } catch (error) {
        console.error("Error saving changes: ", error);
        alert("Failed to save changes.");
    } finally {
        saveAreaChangesBtn.disabled = false;
        saveAreaChangesBtn.textContent = "Save Changes";
    }
}

function renderLandmarkEditor() {
    landmarkListEditor.innerHTML = '';
    const sortedLandmarks = [...editedLandmarks].sort();
    
    if (sortedLandmarks.length === 0) {
        landmarkListEditor.innerHTML = '<li class="text-gray-400 text-sm">No landmarks added yet.</li>';
    } else {
        sortedLandmarks.forEach(landmark => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-white p-2 rounded';
            li.innerHTML = `
                <span>${landmark}</span>
                <button class="delete-landmark-btn text-red-500 hover:text-red-700 text-xs" data-landmark-name="${landmark}" title="Remove landmark">
                    <i class="fa-solid fa-times"></i>
                </button>
            `;
            landmarkListEditor.appendChild(li);
        });
    }
}

function populateAreaConfigDropdown() {
    const currentValue = areaConfigSelect.value;
    areaConfigSelect.innerHTML = '<option value="">-- Select Area --</option>';
    allServiceAreas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.id;
        option.textContent = area.name;
        areaConfigSelect.appendChild(option);
    });
    areaConfigSelect.value = currentValue;
}

function listenForServiceAreas() {
    const q = query(collection(db, "serviceAreas"), orderBy("name"));
    onSnapshot(q, (querySnapshot) => {
        allServiceAreas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Refresh all relevant UI components with new data
        populateAreaDropdown(serviceAreaInput, "Select a service area...");
        populateAreaDropdown(customerServiceAreaInput, "Select a service area...");
        
        if (!adminContainer.classList.contains('hidden')) {
            populateAreaDropdown(areaFilterInput, "All Areas", "all");
            populateAreaDropdown(mapAreaFilter, "All Areas", "all");
            populateAreaDropdown(analyticsAreaFilter, "", "");
        }
        
        populateAreaConfigDropdown();
    });
}


// --- Staff Management (Admin) ---
function setAddStaffButtonLoading(isLoading) {
    confirmAddStaffBtn.disabled = isLoading;
    addStaffBtnText.classList.toggle('hidden', isLoading);
    addStaffBtnLoader.classList.toggle('hidden', !isLoading);
}

function setDeleteStaffButtonLoading(isLoading) {
    confirmDeleteStaffBtn.disabled = isLoading;
    deleteStaffBtnText.classList.toggle('hidden', isLoading);
    deleteStaffBtnLoader.classList.toggle('hidden', !isLoading);
}

function closeAndResetStaffModal() {
    addStaffModal.classList.add('hidden');
    newStaffNameInput.value = '';
    newStaffMobileInput.value = '';
    staffToEditId = null;
    addStaffModal.querySelector('h2').textContent = "Add New Staff Member";
    confirmAddStaffBtn.querySelector('span').textContent = "Save";
    addStaffError.classList.add('hidden');
}

async function handleSaveStaff() {
    const newName = newStaffNameInput.value.trim();
    const newMobile = newStaffMobileInput.value.trim();
    if (!newName || !newMobile) {
        addStaffError.textContent = "Staff name and mobile number cannot be empty.";
        addStaffError.classList.remove('hidden');
        return;
    }
    addStaffError.classList.add('hidden');
    setAddStaffButtonLoading(true);

    try {
        if (staffToEditId) {
            const staffRef = doc(db, "staffMembers", staffToEditId);
            await updateDoc(staffRef, { name: newName, mobile: newMobile });
            showSuccess("Staff member updated successfully.");
        } else {
            await addDoc(collection(db, "staffMembers"), {
                name: newName,
                mobile: newMobile,
                timestamp: new Date()
            });
            showSuccess("New staff member added successfully.");
        }
        
        closeAndResetStaffModal();

    } catch (error) {
        console.error("Error saving staff member:", error);
        addStaffError.textContent = "Failed to save staff member. Please try again.";
        addStaffError.classList.remove('hidden');
    } finally {
        setAddStaffButtonLoading(false);
    }
}

async function handleDeleteStaff() {
    if (!staffToDeleteId) return;
    setDeleteStaffButtonLoading(true);
    try {
        await deleteDoc(doc(db, "staffMembers", staffToDeleteId));
    } catch (error) {
        console.error("Error deleting staff member:", error);
    } finally {
        deleteStaffModal.classList.add('hidden');
        staffToDeleteId = null;
        setDeleteStaffButtonLoading(false);
    }
}

// REPLACE the old calculateAndRenderStaffStats function with this one
// REPLACE the old calculateAndRenderStaffStats function with this new one
function calculateAndRenderStaffStats() {
    if (!allStaff.length) {
        staffStatsTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4">No staff data available.</td></tr>`;
        return;
    };

    const period = staffPerfPeriod.value;
    let filteredJobs = allJobs;
    const now = new Date();
    
    // This logic now ONLY applies to job counts
    if (period === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        filteredJobs = allJobs.filter(job => (job.timestamp.seconds * 1000) >= start.getTime());
    } else if (period === 'week') {
        const start = new Date();
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        filteredJobs = allJobs.filter(job => (job.timestamp.seconds * 1000) >= start.getTime());
    } else if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredJobs = allJobs.filter(job => (job.timestamp.seconds * 1000) >= start.getTime());
    } else if (period === 'custom') {
        const start = staffPerfStartDate.valueAsDate;
        const end = staffPerfEndDate.valueAsDate;
        if (start && end) {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            filteredJobs = allJobs.filter(job => {
                const jobDate = job.timestamp.seconds * 1000;
                return jobDate >= start.getTime() && jobDate <= end.getTime();
            });
        }
    }

    const staffStats = {};
    allStaff.forEach(staff => {
        staffStats[staff.name] = {
            id: staff.id,
            mobile: staff.mobile || 'N/A',
            Installation: 0,
            Maintenance: 0,
            Repair: 0,
            total: 0
        };
    });

    filteredJobs.forEach(job => {
        if (staffStats[job.staffName] && job.category) {
            if (!staffStats[job.staffName][job.category]) {
                staffStats[job.staffName][job.category] = 0;
            }
            staffStats[job.staffName][job.category]++;
            staffStats[job.staffName].total++;
        }
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyJobs = allJobs.filter(job => (job.timestamp.seconds * 1000) >= monthStart.getTime());
    const monthlyTotals = {};
    let bestPerformerName = '';
    let maxJobs = 0;

    monthlyJobs.forEach(job => {
        if (job.staffName) {
            monthlyTotals[job.staffName] = (monthlyTotals[job.staffName] || 0) + 1;
        }
    });
    
    if (Object.keys(monthlyTotals).length > 0) {
        for (const staffName in monthlyTotals) {
            if (monthlyTotals[staffName] > maxJobs) {
                maxJobs = monthlyTotals[staffName];
                bestPerformerName = staffName;
            }
        }
    }

    staffStatsTableBody.innerHTML = '';
    if (Object.keys(staffStats).length === 0) {
        staffStatsTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4">No staff members found.</td></tr>`;
        return;
    }

    for (const name in staffStats) {
        const stats = staffStats[name];
        const staffMember = allStaff.find(s => s.id === stats.id);
        const allLeaveDates = staffMember?.leaves || [];
        
        // --- NEW SIMPLIFIED LEAVE LOGIC ---
        // This logic is now independent of the date range filter
        const currentYear = new Date().getFullYear().toString();
        const currentYearLeaveDates = allLeaveDates.filter(dateStr => dateStr.startsWith(currentYear));
        const leaveCount = currentYearLeaveDates.length;

        const leaveCountCellHtml = leaveCount > 0
            ? `<a href="#" class="view-leave-dates-btn text-blue-600 hover:underline" data-name="${name}" data-dates="${currentYearLeaveDates.join(',')}">${leaveCount}</a>`
            : '0';

        const row = document.createElement('tr');
        row.className = 'border-b';
        row.innerHTML = `
            <td class="py-2 px-4 font-medium">${name === bestPerformerName && maxJobs > 0 ? '<i class="fa-solid fa-star text-yellow-400 mr-2" title="Best Performer of the Month"></i>' : ''}${name}</td>
            <td class="py-2 px-4">${stats.mobile}</td>
            <td class="py-2 px-4 text-center">${stats.Installation || 0}</td>
            <td class="py-2 px-4 text-center">${stats.Maintenance || 0}</td>
            <td class="py-2 px-4 text-center">${stats.Repair || 0}</td>
            <td class="py-2 px-4 text-center font-bold">${stats.total}</td>
            <td class="py-2 px-4 text-center">${leaveCountCellHtml}</td>
            <td class="py-2 px-4">
                <button class="leave-calendar-btn text-green-600 hover:text-green-800 mr-3" data-id="${stats.id}" data-name="${name}" title="Manage Leaves"><i class="fa-solid fa-calendar-days"></i></button>
                <button class="edit-staff-btn text-blue-600 hover:text-blue-800 mr-3" data-id="${stats.id}" title="Edit Staff Member"><i class="fa-solid fa-pencil-alt"></i></button>
                <button class="delete-staff-btn text-red-500 hover:text-red-700" data-id="${stats.id}" title="Delete Staff Member"><i class="fa-solid fa-trash-alt"></i></button>
            </td>
        `;
        staffStatsTableBody.appendChild(row);
    }
}

function populateStaffDropdowns(staff) {
    const lang = localStorage.getItem('language') || 'en';
    
    const staffNameCurrent = staffNameInput.value;
    staffNameInput.innerHTML = `<option value="" disabled selected>${translations[lang].selectStaffName}</option>`;
    staff.forEach(member => {
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        staffNameInput.appendChild(option);
    });
    staffNameInput.value = staffNameCurrent;

    const customerStaffNameCurrent = customerStaffNameInput.value;
    customerStaffNameInput.innerHTML = `<option value="" disabled selected>${translations[lang].selectStaffName}</option>`;
    staff.forEach(member => {
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        customerStaffNameInput.appendChild(option);
    });
    customerStaffNameInput.value = customerStaffNameCurrent;
}

function listenForStaffMembers() {
    const q = query(collection(db, "staffMembers"), orderBy("name", "asc"));
    onSnapshot(q, (querySnapshot) => {
        allStaff = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populateStaffDropdowns(allStaff);
        if(!manageStaffView.classList.contains('hidden')) {
            calculateAndRenderStaffStats();
        }
    });
}


// --- Staff View Logic ---
function clearStaffForm() {
    ['job-type', 'landmark', 'junction-address', 'job-notes', 'photo', 'location-search-input'].forEach(id => document.getElementById(id).value = '');
    staffNameInput.value = ""; 
    serviceAreaInput.value = '';
    ['staff-name-error', 'job-type-error', 'service-area-error', 'landmark-error', 'photo-error', 'location-error', 'job-notes-error'].forEach(id => {
        const el = document.getElementById(id);
        el.textContent = '';
        el.classList.add('hidden');
    });
    filesToUpload = [];
    imagePreviewContainer.innerHTML = '';
    stopCameraStream();
    selectedLocation = null;
    locationSection.classList.remove('hidden');
    junctionAddressContainer.classList.add('hidden');
    if (staffMap) {
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };
        staffMap.setCenter(defaultCenter);
        staffMap.setZoom(5);
        if (staffMarker) staffMarker.setMap(null);
    }
    populateLandmarks(serviceAreaInput, landmarkInput);
    
    isEditMode = false;
    jobToEdit = null;
    document.getElementById('staff-view-title').textContent = "Record Job Activity";
    document.getElementById('submit-job-text').textContent = "Submit";
}

function stopCameraStream() {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    cameraView.classList.add('hidden');
}

function stopCustomerCameraStream() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    customerCameraView.classList.add('hidden');
}

function renderPreviews(filesOrUrls, container) {
    container.innerHTML = '';
    filesOrUrls.forEach((item, index) => {
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'relative';

        const removeBtn = document.createElement('button');
        removeBtn.dataset.index = index;
        removeBtn.className = 'remove-img-btn absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10';
        removeBtn.innerHTML = '×';
        previewWrapper.appendChild(removeBtn);

        const img = document.createElement('img');
        img.className = 'w-full h-24 object-cover rounded-lg';
        
        if (typeof item === 'string') {
            img.src = item;
            removeBtn.dataset.url = item;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            }
            reader.readAsDataURL(item);
        }
        
        previewWrapper.appendChild(img);
        container.appendChild(previewWrapper);
    });
}

function populateAreaDropdown(selectElement, placeholderText = "", placeholderValue = "") {
    const currentValue = selectElement.value;
    selectElement.innerHTML = '';
    if (placeholderText) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = placeholderValue;
        placeholderOption.textContent = placeholderText;
        if (!currentValue && placeholderValue === "") { 
            placeholderOption.selected = true;
            placeholderOption.disabled = true;
        }
        selectElement.appendChild(placeholderOption);
    }
    allServiceAreas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.name;
        option.textContent = area.name;
        selectElement.appendChild(option);
    });
    if(allServiceAreas.some(a => a.name === currentValue)) {
        selectElement.value = currentValue;
    }
}

function populateLandmarks(areaInput, landmarkEl) {
    const selectedAreaName = areaInput.value;
    const selectedArea = allServiceAreas.find(a => a.name === selectedAreaName);
    const landmarks = selectedArea ? selectedArea.landmarks : [];
    
    landmarkEl.innerHTML = '';
    if (landmarks.length > 0) {
        landmarks.forEach(landmark => {
            const option = document.createElement('option');
            option.value = landmark;
            option.textContent = landmark;
            landmarkEl.appendChild(option);
        });
        landmarkEl.disabled = false;
    } else {
        const option = document.createElement('option');
        option.textContent = 'No landmarks for this area';
        option.disabled = true;
        landmarkEl.appendChild(option);
        landmarkEl.disabled = true;
    }
}

function initStaffView(user) {
    const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogle);
            if (!staffMap) {
                initStaffMapAndAutocomplete();
            }
        }
    }, 100);

    if (!staffViewInitialized) {
        photoInput.addEventListener('change', (e) => {
            filesToUpload.push(...e.target.files);
            renderPreviews(filesToUpload, imagePreviewContainer);
            document.getElementById('photo-error').classList.add('hidden');
            e.target.value = null;
        });
        openCameraBtn.addEventListener('click', async () => {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                cameraView.classList.remove('hidden');
                cameraStream.srcObject = currentStream;
            } catch (err) { console.error("Error accessing camera:", err); }
        });
        captureBtn.addEventListener('click', () => {
            const context = cameraCanvas.getContext('2d');
            cameraCanvas.width = cameraStream.videoWidth;
            cameraCanvas.height = cameraStream.videoHeight;
            context.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);
            cameraCanvas.toBlob(blob => {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                filesToUpload.push(file);
                renderPreviews(filesToUpload, imagePreviewContainer);
                stopCameraStream();
                document.getElementById('photo-error').classList.add('hidden');
            }, 'image/jpeg', 0.9);
        });
        staffViewInitialized = true;
    }
}

function initStaffMapAndAutocomplete() {
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    staffMap = new google.maps.Map(document.getElementById('staff-map'), {
        center: defaultCenter,
        zoom: 5,
        disableDefaultUI: true,
    });

    const autocomplete = new google.maps.places.Autocomplete(locationSearchInput);
    autocomplete.bindTo('bounds', staffMap);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
        }

        if (place.geometry.viewport) {
            staffMap.fitBounds(place.geometry.viewport);
        } else {
            staffMap.setCenter(place.geometry.location);
            staffMap.setZoom(17);
        }
        
        if (staffMarker) staffMarker.setMap(null);
        staffMarker = new google.maps.Marker({
            position: place.geometry.location,
            map: staffMap
        });

        selectedLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        document.getElementById('location-error').classList.add('hidden');

        if (place.formatted_address) {
            junctionAddressInput.value = place.formatted_address;
        }
    });
}

function validateForm() {
    let isValid = true;
    const lang = localStorage.getItem('language') || 'en';
    const errorMessages = {
        en: { name: "Please select your name.", jobType: "Please select a job type.", serviceArea: "Please select a service area.", landmark: "Please select a landmark.", photo: "Please attach at least one photo.", location: "Please provide a location.", jobNotes: "Please enter customer details or job notes." },
        hi: { name: "कृपया अपना नाम चुनें।", jobType: "कृपया जॉब का प्रकार चुनें।", serviceArea: "कृपया सेवा क्षेत्र चुनें।", landmark: "कृपया एक मील का पत्थर चुनें।", photo: "कृपया कम से कम एक फोटो संलग्न करें।", location: "कृपया एक स्थान प्रदान करें।", jobNotes: "कृपया ग्राहक विवरण या जॉब नोट्स दर्ज करें।" }
    };
    ['staff-name-error', 'job-type-error', 'service-area-error', 'landmark-error', 'photo-error', 'location-error', 'job-notes-error'].forEach(id => document.getElementById(id).classList.add('hidden'));
    
    if (!staffNameInput.value) {
        document.getElementById('staff-name-error').textContent = errorMessages[lang].name;
        document.getElementById('staff-name-error').classList.remove('hidden');
        isValid = false;
    }
    if (!jobTypeInput.value) {
        document.getElementById('job-type-error').textContent = errorMessages[lang].jobType;
        document.getElementById('job-type-error').classList.remove('hidden');
        isValid = false;
    }
    if (!serviceAreaInput.value) {
        document.getElementById('service-area-error').textContent = errorMessages[lang].serviceArea;
        document.getElementById('service-area-error').classList.remove('hidden');
        isValid = false;
    }
    if (!landmarkInput.value || landmarkInput.disabled) {
        document.getElementById('landmark-error').textContent = errorMessages[lang].landmark;
        document.getElementById('landmark-error').classList.remove('hidden');
        isValid = false;
    }
    if (!selectedLocation) {
        document.getElementById('location-error').textContent = errorMessages[lang].location;
        document.getElementById('location-error').classList.remove('hidden');
        isValid = false;
    }
    if (!jobNotesInput.value.trim()) {
        document.getElementById('job-notes-error').textContent = errorMessages[lang].jobNotes;
        document.getElementById('job-notes-error').classList.remove('hidden');
        isValid = false;
    }
    const existingPhotos = Array.from(imagePreviewContainer.querySelectorAll('img')).length;
    if (filesToUpload.length === 0 && existingPhotos === 0) {
        document.getElementById('photo-error').textContent = errorMessages[lang].photo;
        document.getElementById('photo-error').classList.remove('hidden');
        isValid = false;
    }
    return isValid;
}

function setSubmitButtonLoading(isLoading, type = 'job') {
    const btnText = document.getElementById(type === 'job' ? 'submit-job-text' : 'submit-customer-text');
    const btnLoader = document.getElementById(type === 'job' ? 'submit-job-loader' : 'submit-customer-loader');
    const btn = type === 'job' ? submitJobBtn : submitCustomerBtn;

    btn.disabled = isLoading;
    btnText.classList.toggle('hidden', isLoading);
    btnLoader.classList.toggle('hidden', !isLoading);
    btn.classList.toggle('bg-gray-400', isLoading);
}


function setUpdateButtonLoading(isLoading) {
    confirmUpdateBtn.disabled = isLoading;
    updateBtnText.classList.toggle('hidden', isLoading);
    updateBtnLoader.classList.toggle('hidden', !isLoading);
    confirmUpdateBtn.classList.toggle('bg-gray-400', isLoading);
}

function setCurrentLocationButtonLoading(isLoading, type = 'staff') {
    const btn = type === 'staff' ? currentLocationBtn : customerCurrentLocationBtn;
    const btnText = document.getElementById(type === 'staff' ? 'current-location-btn-text' : 'customer-current-location-btn-text');
    const btnLoader = document.getElementById(type === 'staff' ? 'current-location-loader' : 'customer-current-location-loader');
    
    btn.disabled = isLoading;
    btnText.classList.toggle('hidden', isLoading);
    btnLoader.classList.toggle('hidden', !isLoading);
    btn.classList.toggle('bg-gray-400', isLoading);
}

// --- Admin View Logic ---

window.initMap = () => {
    if (document.getElementById("map")) {
        const mapOptions = {
            center: { lat: 20.5937, lng: 78.9629 },
            zoom: 5,
        };
        googleMap = new google.maps.Map(document.getElementById("map"), mapOptions);
    }
}

function setDeleteButtonLoading(isLoading) {
    confirmDeleteBtn.disabled = isLoading;
    deleteBtnText.classList.toggle('hidden', isLoading);
    deleteBtnLoader.classList.toggle('hidden', !isLoading);
    confirmDeleteBtn.classList.toggle('bg-gray-400', isLoading);
}

async function handleDeleteJob() {
    if (!jobToDelete) return;
    setDeleteButtonLoading(true);

    try {
        await deleteDoc(doc(db, "jobs", jobToDelete));
    } catch (error) {
        console.error("Error deleting job:", error);
    } finally {
        deleteModal.classList.add('hidden');
        jobToDelete = null;
        setDeleteButtonLoading(false);
    }
}

function initAdminView() {
    listenForJobs();
}

function populateFilterDropdowns() {
    // Area filter is populated by listenForServiceAreas
    const selectedJobType = jobTypeFilterInput.value;
    const selectedStaff = staffNameFilterInput.value;

    const jobTypes = [...new Set(allJobs.map(job => job.category))].filter(Boolean);
    const staffNames = [...new Set(allJobs.map(job => job.staffName))].filter(Boolean);

    jobTypeFilterInput.innerHTML = '<option value="all">All Job Types</option>';
    jobTypes.forEach(type => {
        jobTypeFilterInput.innerHTML += `<option value="${type}">${type}</option>`;
    });

    staffNameFilterInput.innerHTML = '<option value="all">All Staff</option>';
    staffNames.forEach(name => {
        staffNameFilterInput.innerHTML += `<option value="${name}">${name}</option>`;
    });

    jobTypeFilterInput.value = selectedJobType;
    staffNameFilterInput.value = selectedStaff;
}

function populateDashboardLandmarkFilter() {
    const selectedAreaName = areaFilterInput.value;
    const currentLandmark = landmarkFilterInput.value;
    const selectedArea = allServiceAreas.find(a => a.name === selectedAreaName);
    const landmarks = selectedArea ? selectedArea.landmarks : [];

    landmarkFilterInput.innerHTML = '<option value="all">All Landmarks</option>';
    if (landmarks.length > 0 && selectedAreaName !== 'all') {
        landmarks.forEach(landmark => {
            const option = document.createElement('option');
            option.value = landmark;
            option.textContent = landmark;
            landmarkFilterInput.appendChild(option);
        });
        landmarkFilterInput.disabled = false;
        landmarkFilterInput.value = currentLandmark;
    } else {
        landmarkFilterInput.disabled = true;
    }
}


function populateMapLandmarkFilter() {
    const selectedAreaName = mapAreaFilter.value;
    const selectedArea = allServiceAreas.find(a => a.name === selectedAreaName);
    const landmarks = selectedArea ? selectedArea.landmarks : [];
    mapLandmarkFilter.innerHTML = '<option value="all">All Landmarks</option>';

    if (landmarks.length > 0 && selectedAreaName !== 'all') {
        landmarks.forEach(landmark => {
            const option = document.createElement('option');
            option.value = landmark;
            option.textContent = landmark;
            mapLandmarkFilter.appendChild(option);
        });
        mapLandmarkFilter.disabled = false;
    } else {
        mapLandmarkFilter.disabled = true;
    }
}


function applyFiltersAndSort() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedArea = areaFilterInput.value;
    const selectedLandmark = landmarkFilterInput.value;
    const selectedJobType = jobTypeFilterInput.value;
    const selectedStaff = staffNameFilterInput.value;
    const period = dashboardPeriod.value;
    let filteredJobs = allJobs;

    const now = new Date();
    let startDate = new Date();
    if (period === 'week') {
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        filteredJobs = filteredJobs.filter(job => (job.timestamp.seconds * 1000) >= startDate.getTime());
    } else if (period === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        filteredJobs = filteredJobs.filter(job => (job.timestamp.seconds * 1000) >= startDate.getTime());
    } else if (period === 'custom') {
        const start = dashboardStartDate.valueAsDate;
        const end = dashboardEndDate.valueAsDate;
        if (start && end) {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            filteredJobs = filteredJobs.filter(job => {
                const jobDate = job.timestamp.seconds * 1000;
                return jobDate >= start.getTime() && jobDate <= end.getTime();
            });
        }
    }

    if (selectedArea !== 'all') filteredJobs = filteredJobs.filter(job => job.area === selectedArea);
    if (selectedLandmark !== 'all') filteredJobs = filteredJobs.filter(job => job.landmark === selectedLandmark);
    if (selectedJobType !== 'all') filteredJobs = filteredJobs.filter(job => job.category === selectedJobType);
    if (selectedStaff !== 'all') filteredJobs = filteredJobs.filter(job => job.staffName === selectedStaff);
    
    if (searchTerm) {
        filteredJobs = filteredJobs.filter(job => 
            (job.notes.toLowerCase() + (job.customerAddress || '')).includes(searchTerm)
        );
    }

    filteredJobs.sort((a, b) => {
        const valA = a[currentSort.key];
        const valB = b[currentSort.key];
        const modifier = currentSort.dir === 'asc' ? 1 : -1;

        let comparison = 0;
        if (currentSort.key === 'timestamp') {
            comparison = valA.seconds - valB.seconds;
        } else {
            comparison = String(valA).localeCompare(String(valB));
        }
        return comparison * modifier;
    });

    document.querySelectorAll('.sortable-header i').forEach(icon => {
        icon.className = 'fa-solid fa-sort';
    });
    const activeHeader = document.querySelector(`.sortable-header[data-sort="${currentSort.key}"] i`);
    if (activeHeader) {
        activeHeader.className = currentSort.dir === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
    }
    
    currentFilteredJobs = filteredJobs;
    renderDashboardTable(filteredJobs);
}

function applyMapFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const isTrackingView = urlParams.get('view') === 'track_customer';

    const selectedArea = mapAreaFilter.value;
    const selectedLandmark = mapLandmarkFilter.value;
    const selectedCustomerType = mapCustomerTypeFilter.value;
    const searchTerm = mapSearchInput.value.toLowerCase();
    
    let filteredJobs = isTrackingView 
        ? allJobs.filter(j => j.category === 'Installation') 
        : allJobs;

    if (selectedArea !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.area === selectedArea);
    }
    
    if (isTrackingView && selectedLandmark !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.landmark === selectedLandmark);
    }

    if (isTrackingView && selectedCustomerType !== 'all') {
        filteredJobs = filteredJobs.filter(job => 
            job.notes && job.notes.includes(`Customer Type: ${selectedCustomerType}`)
        );
    }
    
    if (searchTerm) {
        filteredJobs = filteredJobs.filter(job => 
            (job.notes.toLowerCase() + (job.customerAddress || '').toLowerCase() + (job.staffName || '').toLowerCase() + (job.category || '').toLowerCase()).includes(searchTerm)
        );
    }
    
    renderMapMarkers(filteredJobs);
}


function listenForJobs() {
    const q = query(collection(db, "jobs"), orderBy("timestamp", "desc"));
    onSnapshot(q, (querySnapshot) => {
        allJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        populateFilterDropdowns();
        populateDashboardLandmarkFilter();
        applyFiltersAndSort();
        if(!manageStaffView.classList.contains('hidden')) {
            calculateAndRenderStaffStats();
        }
        if (!analyticsView.classList.contains('hidden')) {
            renderAnalytics();
        }

        if (isInitialLoad) {
            document.getElementById('dashboard-loader').classList.add('hidden');
            
            const urlParams = new URLSearchParams(window.location.search);
            const viewParam = urlParams.get('view');

            if (viewParam === 'map') {
                 const jobId = urlParams.get('jobId');
                 const area = urlParams.get('area');

                 if (jobId) {
                     const jobToShow = allJobs.find(j => j.id === jobId);
                     if (jobToShow) {
                         dashboardView.classList.add('hidden');
                         mapView.classList.remove('hidden');
                         const checkMapReady = setInterval(() => {
                             if (googleMap) {
                                 clearInterval(checkMapReady);
                                 renderMapMarkers([jobToShow]);
                                 googleMap.setCenter(jobToShow.location);
                                 googleMap.setZoom(16);
                             }
                         }, 100);
                     }
                 } 
                 else if (area) {
                    dashboardView.classList.add('hidden');
                    mapView.classList.remove('hidden');
                    const landmark = urlParams.get('landmark');
                    const jobType = urlParams.get('jobType');
                    const startStr = urlParams.get('startDate');
                    const endStr = urlParams.get('endDate');
                    
                    const checkMapReady = setInterval(() => {
                        if (googleMap && allJobs.length > 0) {
                            clearInterval(checkMapReady);
                            let filtered = allJobs;
                            if (area) filtered = filtered.filter(j => j.area === area);
                            if (landmark && landmark !== 'all') filtered = filtered.filter(j => j.landmark === landmark);
                            if (jobType && jobType !== 'all') filtered = filtered.filter(j => j.category === jobType);
                            if (startStr && endStr) {
                                const start = parseInt(startStr, 10);
                                const end = parseInt(endStr, 10);
                                filtered = filtered.filter(j => {
                                    const jobTime = j.timestamp.seconds * 1000;
                                    return jobTime >= start && jobTime <= end;
                                });
                            }
                            renderMapMarkers(filtered);
                        }
                    }, 100);
                 }
            }
            else if (viewParam === 'track_customer') {
                dashboardView.classList.add('hidden');
                mapView.classList.remove('hidden');
                
                document.getElementById('map-view-logo').classList.add('hidden');
                addCustomerBtn.classList.remove('hidden');
                document.getElementById('map-landmark-filter-container').classList.remove('hidden');
                document.getElementById('map-customer-type-filter-container').classList.remove('hidden');
                document.getElementById('map-view-title').textContent = "Customer Locations";
                
                document.getElementById('back-to-dashboard-btn').addEventListener('click', e => {
                    e.preventDefault();
                    window.close();
                });

                const checkMapReady = setInterval(() => {
                    if (googleMap) {
                        clearInterval(checkMapReady);
                        applyMapFilters();
                    }
                }, 100);
            }
            isInitialLoad = false;
        }
    });
}

function renderDashboardTable(jobs) {
    dashboardTableBody.innerHTML = '';
    if (jobs.length === 0) {
        dashboardTableBody.innerHTML = `<tr><td colspan="8" class="text-center p-4">No matching jobs found.</td></tr>`;
        return;
    }
    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.className = 'border-b';
        row.innerHTML = `
            <td class="py-2 px-4">${job.area || 'N/A'}</td>
            <td class="py-2 px-4">${job.landmark || 'N/A'}</td>
            <td class="py-2 px-4">${job.category}</td>
            <td class="py-2 px-4">${job.staffName}</td>
            <td class="py-2 px-4">${job.customerAddress || 'N/A'}</td>
            <td class="py-2 px-4">${(job.notes || '').replace(/\n/g, '<br>')}</td>
            <td class="py-2 px-4">${new Date(job.timestamp.seconds * 1000).toLocaleString()}</td>
            <td class="py-2 px-4">
                <div class="flex items-center gap-3">
                    <button class="edit-job-btn text-blue-600 hover:underline" data-job-id="${job.id}" title="Edit Job"><i class="fa-solid fa-pencil-alt"></i></button>
                    <a href="index.html?view=map&jobId=${job.id}" target="_blank" class="text-blue-600 hover:underline" title="View on Map"><i class="fa-solid fa-map-location-dot"></i></a>
                    ${(job.photoURLs && job.photoURLs.length > 0) ? `<button class="view-photos-btn text-blue-600 hover:underline" data-job-id="${job.id}" title="View Photos"><i class="fa-solid fa-images"></i> (${job.photoURLs.length})</button>` : ''}
                    <button class="delete-job-btn text-red-500 hover:text-red-700" data-job-id="${job.id}" title="Delete Job"><i class="fa-solid fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        dashboardTableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jobId = e.currentTarget.dataset.jobId;
            const jobData = allJobs.find(j => j.id === jobId);
            if (jobData) {
                isEditMode = true;
                jobToEdit = jobId;

                if (jobData.category === 'Installation') {
                    initCustomerView();
                    populateCustomerFormForEdit(jobData);
                    dashboardView.classList.add('hidden');
                    adminContainer.classList.add('hidden');
                    customerView.classList.remove('hidden');
                } else {
                    populateStaffFormForEdit(jobData);
                    dashboardView.classList.add('hidden');
                    adminContainer.classList.add('hidden');
                    staffView.classList.remove('hidden');
                }
            }
        });
    });

    document.querySelectorAll('.view-photos-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jobId = e.currentTarget.dataset.jobId;
            const job = allJobs.find(j => j.id === jobId);
            if (job && job.photoURLs) {
                openImageModal(job.photoURLs);
            }
        });
    });

    document.querySelectorAll('.delete-job-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            jobToDelete = e.currentTarget.dataset.jobId;
            deleteModal.classList.remove('hidden');
        });
    });
}


function populateStaffFormForEdit(job) {
    document.getElementById('staff-view-title').textContent = "Edit Job Record";
    document.getElementById('submit-job-text').textContent = "Update";
    locationSection.classList.add('hidden');
    junctionAddressContainer.classList.remove('hidden'); // Show for admin edit

    staffNameInput.value = job.staffName;
    jobTypeInput.value = job.category;
    serviceAreaInput.value = job.area;
    populateLandmarks(serviceAreaInput, landmarkInput);
    landmarkInput.value = job.landmark;
    junctionAddressInput.value = job.customerAddress || '';
    jobNotesInput.value = job.notes;
    
    selectedLocation = job.location;
    
    filesToUpload = [];
    if (job.photoURLs && job.photoURLs.length > 0) {
        filesToUpload.push(...job.photoURLs);
        renderPreviews(filesToUpload, imagePreviewContainer);
    } else {
        imagePreviewContainer.innerHTML = '';
    }
}


function openImageModal(images) {
    modalImages = images;
    currentModalImageIndex = 0;
    imageModal.classList.remove('hidden');
    showModalImage(0);
}

function showModalImage(index) {
    if (index < 0 || index >= modalImages.length) return;
    currentModalImageIndex = index;
    modalImage.src = modalImages[index];
    downloadImageBtn.href = modalImages[index];
    prevImageBtn.classList.toggle('hidden', index === 0);
    nextImageBtn.classList.toggle('hidden', index === modalImages.length - 1);
}

function renderMapMarkers(jobs) {
    if (!googleMap) return;

    markers.forEach(marker => marker.setMap(null));
    markers = [];
    if (currentInfoWindow) currentInfoWindow.close();

    const lang = localStorage.getItem('language') || 'en';
    const urlParams = new URLSearchParams(window.location.search);
    const isTrackingView = urlParams.get('view') === 'track_customer';
    mapListInfo.textContent = `Showing ${jobs.length} results.`;

    jobList.innerHTML = '';
    if (jobs.length === 0) {
        jobList.innerHTML = `<p class="text-center text-gray-500 p-4">${translations[lang].noMatchingJobs}</p>`;
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer';
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(job.category).bg} ${getCategoryColor(job.category).text}">${job.category}</span>
            </div>
            <div>
                <p class="font-bold text-gray-800 mt-2">${job.customerAddress || "No Address"}</p>
                <p class="text-sm text-gray-500 mt-1"><i class="fa-solid fa-user mr-1"></i> ${job.staffName}</p>
                <p class="text-sm text-gray-500"><i class="fa-solid fa-calendar-days mr-1"></i> ${new Date(job.timestamp.seconds * 1000).toLocaleDateString()}</p>
            </div>`;
        
       const markerIcon = isTrackingView ? {
            path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", 
            fillColor: '#05a04bff', 
            fillOpacity: 1,
            strokeWeight: 0,
            strokeColor: '#02000ac7', 
            strokeWeight: 3,
            rotation: 0,
            scale: 1.4,
            anchor: new google.maps.Point(12, 12),
        } : {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: getCategoryColor(job.category).marker,
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
        };
        
        const marker = new google.maps.Marker({
            position: job.location,
            map: googleMap,
            title: job.customerAddress || job.category,
            icon: markerIcon,
        });

        card.addEventListener('click', () => {
            googleMap.panTo(job.location);
            googleMap.setZoom(16);
            new google.maps.event.trigger(marker, 'click');
        });
        jobList.appendChild(card);

        const photoGallery = (job.photoURLs && job.photoURLs.length > 0) 
            ? `<div class="flex gap-2 overflow-x-auto mt-2 pb-2">${job.photoURLs.map(url => `<a href="${url}" target="_blank"><img src="${url}" class="h-20 w-20 object-cover rounded-md"></a>`).join('')}</div>`
            : '';

        const infoWindowContent = `
            <div class="w-64">
                <h3 class="font-bold text-lg mb-2">${job.category} <span class="text-sm font-medium text-gray-500">(${job.area}, ${job.landmark})</span></h3>
                <p class="text-sm text-gray-800 mb-2"><b>Address:</b> ${job.customerAddress || "No Address"}</p>
                <p class="text-gray-700 mb-2 whitespace-pre-wrap">${job.notes}</p>
                ${photoGallery}
                <div class="text-xs text-gray-500 mt-2 border-t pt-2">
                    <p><i class="fa-solid fa-user mr-1"></i> ${job.staffName}</p>
                    <p><i class="fa-solid fa-clock mr-1"></i> ${new Date(job.timestamp.seconds * 1000).toLocaleString()}</p>
                </div>
                <div class="mt-3 flex flex-col space-y-2">
                    <a href="https://maps.google.com/?q=${job.location.lat},${job.location.lng}" target="_blank" class="w-full text-center bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 font-semibold">Navigate</a>
                    <button id="share-location-btn-${job.id}" class="w-full bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700">Share Location</button>
                    ${(job.photoURLs && job.photoURLs.length > 0) ? `<button id="share-photo-btn-${job.id}" class="w-full bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700">Share Photo</button>` : ''}
                </div>
            </div>`;
        
        const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });

        marker.addListener('click', () => {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
            infoWindow.open(googleMap, marker);
            currentInfoWindow = infoWindow;
        });

        google.maps.event.addListener(infoWindow, 'domready', () => {
            const shareLocationBtn = document.getElementById(`share-location-btn-${job.id}`);
            if (shareLocationBtn) {
                shareLocationBtn.addEventListener('click', async () => {
                    const locationUrl = `https://maps.google.com/?q=${job.location.lat},${job.location.lng}`;
                    const shareData = { title: 'Cable Job Location', text: `Location for job: ${job.notes}`, url: locationUrl };
                     try {
                        if (navigator.share) await navigator.share(shareData);
                        else {
                            await navigator.clipboard.writeText(locationUrl);
                            shareLocationBtn.textContent = "Copied!";
                            setTimeout(() => { shareLocationBtn.textContent = "Share Location"; }, 2000);
                        }
                    } catch(err) { console.error("Share failed:", err); }
                });
            }
            const sharePhotoBtn = document.getElementById(`share-photo-btn-${job.id}`);
            if (sharePhotoBtn) {
                sharePhotoBtn.addEventListener('click', async () => {
                    try {
                        const files = await Promise.all(job.photoURLs.map(async (url, i) => {
                            const response = await fetch(url);
                            const blob = await response.blob();
                            return new File([blob], `photo-${i+1}.jpg`, { type: blob.type });
                        }));

                        if (navigator.canShare && navigator.canShare({ files })) {
                            await navigator.share({
                                title: 'Cable Job Photos',
                                text: `Photos from job: ${job.notes}`,
                                files: files
                            });
                        } else {
                            throw new Error("File sharing not supported.");
                        }
                    } catch (err) {
                        console.error("File share failed, falling back to URL:", err);
                        await navigator.clipboard.writeText(job.photoURLs.join(', '));
                        sharePhotoBtn.textContent = "Copied!";
                        setTimeout(() => { sharePhotoBtn.textContent = "Share Photo"; }, 2000);
                    }
                });
            }
        });
        
        markers.push(marker);
        bounds.extend(job.location);
    });

    if (jobs.length > 0) {
        googleMap.fitBounds(bounds);
    }
    if (jobs.length === 1) {
        googleMap.setCenter(jobs[0].location);
        googleMap.setZoom(15);
    }
}

function initAnalyticsView() {
    if (analyticsAreaFilter.value === '' && allServiceAreas.length > 0) {
        analyticsAreaFilter.value = allServiceAreas[0].name;
    }
    renderAnalytics();
}

function renderAnalytics() {
    const period = analyticsPeriod.value;
    const selectedArea = analyticsAreaFilter.value;
    customDateRange.classList.toggle('hidden', period !== 'custom');
    
    let filteredJobs = allJobs;
    const now = new Date();
    let startDate = null;
    let endDate = new Date();

    if (period === 'week') {
        const firstDayOfWeek = now.getDate() - now.getDay();
        startDate = new Date(now.setDate(firstDayOfWeek));
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'custom') {
        startDate = startDateInput.valueAsDate;
        let end = endDateInput.valueAsDate;
        if (startDate && end) {
            startDate.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            endDate = end;
        } else {
            endDate = null;
        }
    }
    
    if (startDate && endDate) {
         filteredJobs = allJobs.filter(job => {
            const jobDate = job.timestamp.seconds * 1000;
            return jobDate >= startDate.getTime() && jobDate <= endDate.getTime();
        });
    }

    const analyticsData = filteredJobs.reduce((acc, job) => {
        const { area, landmark, category } = job;
        if (area !== selectedArea || !landmark || !category) return acc;

        if (!acc[area]) {
            acc[area] = {
                landmarks: {},
                totals: { Installation: 0, Maintenance: 0, Repair: 0, total: 0 }
            };
        }
        if (!acc[area].landmarks[landmark]) {
            acc[area].landmarks[landmark] = { Installation: 0, Maintenance: 0, Repair: 0, total: 0 };
        }

        acc[area].landmarks[landmark][category] = (acc[area].landmarks[landmark][category] || 0) + 1;
        acc[area].landmarks[landmark].total++;
        acc[area].totals[category] = (acc[area].totals[category] || 0) + 1;
        acc[area].totals.total++;

        return acc;
    }, {});

    analyticsResults.innerHTML = '';
    const areaData = analyticsData[selectedArea];

    if (!areaData || Object.keys(areaData.landmarks).length === 0) {
        analyticsResults.innerHTML = `<p class="text-center text-gray-500">No data available for this area in the selected period.</p>`;
        return;
    }

    const generateLink = (area, landmark, jobType) => {
        let url = `index.html?view=map&area=${area}&landmark=${landmark}&jobType=${jobType}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate.getTime()}&endDate=${endDate.getTime()}`;
        }
        return url;
    };
    
    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white shadow-md rounded-lg">
                <thead class="bg-gray-200">
                    <tr>
                        <th class="py-3 px-4 text-left font-semibold">Landmark</th>
                        <th class="py-3 px-4 text-center font-semibold">Installation</th>
                        <th class="py-3 px-4 text-center font-semibold">Maintenance</th>
                        <th class="py-3 px-4 text-center font-semibold">Repair</th>
                        <th class="py-3 px-4 text-center font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    const sortedLandmarks = Object.keys(areaData.landmarks).sort();

    for (const landmarkName of sortedLandmarks) {
        const landmarkData = areaData.landmarks[landmarkName];
        tableHtml += `
            <tr class="border-b">
                <td class="py-2 px-4 font-medium">${landmarkName}</td>
                <td class="py-2 px-4 text-center"><a href="${generateLink(selectedArea, landmarkName, 'Installation')}" target="_blank" class="text-blue-600 hover:underline">${landmarkData.Installation || 0}</a></td>
                <td class="py-2 px-4 text-center"><a href="${generateLink(selectedArea, landmarkName, 'Maintenance')}" target="_blank" class="text-blue-600 hover:underline">${landmarkData.Maintenance || 0}</a></td>
                <td class="py-2 px-4 text-center"><a href="${generateLink(selectedArea, landmarkName, 'Repair')}" target="_blank" class="text-blue-600 hover:underline">${landmarkData.Repair || 0}</a></td>
                <td class="py-2 px-4 text-center font-bold"><a href="${generateLink(selectedArea, landmarkName, 'all')}" target="_blank" class="text-blue-600 hover:underline">${landmarkData.total || 0}</a></td>
            </tr>
        `;
    }

    tableHtml += `
                </tbody>
                <tfoot class="bg-gray-100 font-bold">
                    <tr>
                        <td class="py-3 px-4">Total</td>
                        <td class="py-3 px-4 text-center"><a href="${generateLink(selectedArea, 'all', 'Installation')}" target="_blank" class="text-blue-600 hover:underline">${areaData.totals.Installation || 0}</a></td>
                        <td class="py-3 px-4 text-center"><a href="${generateLink(selectedArea, 'all', 'Maintenance')}" target="_blank" class="text-blue-600 hover:underline">${areaData.totals.Maintenance || 0}</a></td>
                        <td class="py-3 px-4 text-center"><a href="${generateLink(selectedArea, 'all', 'Repair')}" target="_blank" class="text-blue-600 hover:underline">${areaData.totals.Repair || 0}</a></td>
                        <td class="py-3 px-4 text-center"><a href="${generateLink(selectedArea, 'all', 'all')}" target="_blank" class="text-blue-600 hover:underline">${areaData.totals.total || 0}</a></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    analyticsResults.innerHTML = tableHtml;
}


function exportToExcel(jobs) {
    const dataToExport = jobs.map(job => ({
        'Area': job.area,
        'Landmark': job.landmark,
        'Job Type': job.category,
        'Staff Name': job.staffName,
        'Address': job.customerAddress,
        'Timestamp': new Date(job.timestamp.seconds * 1000).toLocaleString(),
        'Location': `https://maps.google.com/?q=${job.location.lat},${job.location.lng}`,
        'Photos': (job.photoURLs || []).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");
    XLSX.writeFile(workbook, "Cable_Operations_Export.xlsx");
}

async function imageUrlToBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function exportToPdf(jobs) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        let y = 20;

        if (i > 0) {
            doc.addPage();
        }

        doc.setFontSize(16);
        doc.text("Job Report", pageWidth / 2, y, { align: 'center' });
        y += 10;
        doc.setFontSize(10);
        doc.text(`Timestamp: ${new Date(job.timestamp.seconds * 1000).toLocaleString()}`, margin, y);
        y += 7;
        doc.text(`Staff Name: ${job.staffName}`, margin, y);
        y += 7;
        doc.text(`Area: ${job.area}, ${job.landmark}`, margin, y);
        y += 7;
        doc.text(`Job Type: ${job.category}`, margin, y);
        y += 7;
        doc.text(`Address: ${job.customerAddress || 'N/A'}`, margin, y);
        y += 7;
        
        const locationLink = `https://maps.google.com/?q=${job.location.lat},${job.location.lng}`;
        doc.setTextColor(0, 0, 255);
        doc.textWithLink('View on Map', margin, y, { url: locationLink });
        doc.setTextColor(0, 0, 0);
        y += 10;

        if (job.photoURLs && job.photoURLs.length > 0) {
            doc.setFontSize(12);
            doc.text("Photos:", margin, y);
            y += 5;

            for (const url of job.photoURLs) {
                try {
                    const base64Image = await imageUrlToBase64(url);
                    const imgProps = doc.getImageProperties(base64Image);
                    const imgWidth = 80;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    if (y + imgHeight > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }

                    doc.addImage(base64Image, 'JPEG', margin, y, imgWidth, imgHeight);
                    y += imgHeight + 5;

                } catch (e) {
                    console.error("Error adding image to PDF", e);
                    if (y + 10 > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.text("Could not load image.", margin, y);
                    y += 10;
                }
            }
        }
    }

    doc.save("Cable_Operations_Report.pdf");
}


function getCategoryColor(category) {
    const colors = {
        Installation: { bg: 'bg-green-100', text: 'text-green-800', marker: '#22c55e' },
        Maintenance: { bg: 'bg-blue-100', text: 'text-blue-800', marker: '#3b82f6' },
        Repair: { bg: 'bg-red-100', text: 'text-red-800', marker: '#ef4444' }
    };
    return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-800', marker: '#6b7280' };
}

async function updateJob() {
    if (!validateForm() || !jobToEdit) return;
    
    setUpdateButtonLoading(true);

    try {
        const newFilesToUpload = filesToUpload.filter(item => typeof item !== 'string');
        const existingPhotoURLs = filesToUpload.filter(item => typeof item === 'string');

        const uploadPromises = newFilesToUpload.map(file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
                .then(response => response.json())
                .then(data => data.secure_url);
        });
        const newPhotoURLs = await Promise.all(uploadPromises);

        const allPhotoURLs = [...existingPhotoURLs, ...newPhotoURLs];

        const updatedData = {
            staffName: staffNameInput.value,
            category: jobTypeInput.value,
            area: serviceAreaInput.value,
            landmark: landmarkInput.value,
            customerAddress: junctionAddressInput.value,
            notes: jobNotesInput.value,
            photoURLs: allPhotoURLs,
            lastUpdated: new Date()
        };

        const jobRef = doc(db, "jobs", jobToEdit);
        await updateDoc(jobRef, updatedData);

        filesToUpload = [];
        updateModal.classList.add('hidden');
        const lang = localStorage.getItem('language') || 'en';
        showSuccess(translations[lang].updateSuccessMessage);
        
    } catch (error) {
        console.error("Error updating job:", error);
        alert("Failed to update job. Please try again.");
    } finally {
        setUpdateButtonLoading(false);
    }
}

// --- Customer View Logic ---
function initCustomerView() {
    const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkGoogle);
            if (!customerMap) {
                initCustomerMapAndAutocomplete();
            }
        }
    }, 100);

    if (!customerViewInitialized) {
        customerPhotoInput.addEventListener('change', (e) => {
            customerFilesToUpload.push(...e.target.files);
            renderPreviews(customerFilesToUpload, customerImagePreviewContainer);
            e.target.value = null;
        });

        customerOpenCameraBtn.addEventListener('click', async () => {
            try {
                currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                customerCameraView.classList.remove('hidden');
                customerCameraStream.srcObject = currentStream;
            } catch (err) { console.error("Error accessing camera:", err); }
        });

        customerCaptureBtn.addEventListener('click', () => {
            const context = customerCameraCanvas.getContext('2d');
            customerCameraCanvas.width = customerCameraStream.videoWidth;
            customerCameraCanvas.height = customerCameraStream.videoHeight;
            context.drawImage(customerCameraStream, 0, 0, customerCameraCanvas.width, customerCameraCanvas.height);
            customerCameraCanvas.toBlob(blob => {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                customerFilesToUpload.push(file);
                renderPreviews(customerFilesToUpload, customerImagePreviewContainer);
                stopCustomerCameraStream();
            }, 'image/jpeg', 0.9);
        });
        
        customerCancelCameraBtn.addEventListener('click', stopCustomerCameraStream);

        customerViewInitialized = true;
    }
}

function initCustomerMapAndAutocomplete() {
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    customerMap = new google.maps.Map(document.getElementById('customer-map'), {
        center: defaultCenter,
        zoom: 5,
        disableDefaultUI: true,
    });

    const autocomplete = new google.maps.places.Autocomplete(customerLocationSearchInput);
    autocomplete.bindTo('bounds', customerMap);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        if (place.geometry.viewport) {
            customerMap.fitBounds(place.geometry.viewport);
        } else {
            customerMap.setCenter(place.geometry.location);
            customerMap.setZoom(17);
        }
        
        if (customerMarker) customerMarker.setMap(null);
        customerMarker = new google.maps.Marker({ position: place.geometry.location, map: customerMap });

        customerSelectedLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        document.getElementById('customer-location-error').classList.add('hidden');
    });
}

function clearCustomerForm() {
    ['customer-staff-name', 'customer-name', 'customer-mobile', 'customer-service-area', 'customer-landmark', 'customer-location-search-input', 'customer-notes', 'customer-photo', 'customer-type'].forEach(id => document.getElementById(id).value = '');
    ['customer-staff-name-error', 'customer-name-error', 'customer-mobile-error', 'customer-service-area-error', 'customer-landmark-error', 'customer-location-error', 'customer-type-error'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    customerFilesToUpload = [];
    customerImagePreviewContainer.innerHTML = '';
    customerSelectedLocation = null;
    stopCustomerCameraStream();
    if (customerMap) {
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };
        customerMap.setCenter(defaultCenter);
        customerMap.setZoom(5);
        if (customerMarker) customerMarker.setMap(null);
    }
    populateLandmarks(customerServiceAreaInput, customerLandmarkInput);

    isEditMode = false;
    jobToEdit = null;
    customerViewTitle.textContent = "Add New Customer";
    submitCustomerText.textContent = "Submit";
}

function validateCustomerForm() {
    let isValid = true;
    ['customer-staff-name-error', 'customer-name-error', 'customer-mobile-error', 'customer-service-area-error', 'customer-landmark-error', 'customer-location-error', 'customer-type-error'].forEach(id => document.getElementById(id).classList.add('hidden'));

    if (!customerStaffNameInput.value) {
        document.getElementById('customer-staff-name-error').textContent = "Please select a staff name.";
        document.getElementById('customer-staff-name-error').classList.remove('hidden');
        isValid = false;
    }
    if (!customerNameInput.value.trim()) {
        document.getElementById('customer-name-error').textContent = "Please enter customer's name.";
        document.getElementById('customer-name-error').classList.remove('hidden');
        isValid = false;
    }
    if (!customerMobileInput.value.trim()) {
        document.getElementById('customer-mobile-error').textContent = "Please enter mobile number.";
        document.getElementById('customer-mobile-error').classList.remove('hidden');
        isValid = false;
    }
    if (!customerTypeInput.value) {
        document.getElementById('customer-type-error').textContent = "Please select a customer type.";
        document.getElementById('customer-type-error').classList.remove('hidden');
        isValid = false;
    }
    if (!customerServiceAreaInput.value) {
        document.getElementById('customer-service-area-error').textContent = "Please select a service area.";
        document.getElementById('customer-service-area-error').classList.remove('hidden');
        isValid = false;
    }
    if (!customerLandmarkInput.value || customerLandmarkInput.disabled) {
        document.getElementById('customer-landmark-error').textContent = "Please select a landmark.";
        document.getElementById('customer-landmark-error').classList.remove('hidden');
        isValid = false;
    }
    if (!customerSelectedLocation) {
        document.getElementById('customer-location-error').textContent = "Please provide a location.";
        document.getElementById('customer-location-error').classList.remove('hidden');
        isValid = false;
    }
    return isValid;
}


function parseNotes(notes) {
    const data = { name: '', mobile: '', type: 'Broadband', notes: '' };
    if (!notes) return data;

    const lines = notes.split('\n');
    const isStructured = lines.some(line =>
        line.startsWith('Customer Name:') ||
        line.startsWith('Mobile Number:') ||
        line.startsWith('Customer Type:')
    );

    if (isStructured) {
        let notesBuffer = [];
        let capturingNotes = false;
        lines.forEach(line => {
            if (line.startsWith('Customer Name:')) {
                data.name = line.substring('Customer Name:'.length).trim();
                capturingNotes = false;
            } else if (line.startsWith('Mobile Number:')) {
                data.mobile = line.substring('Mobile Number:'.length).trim();
                capturingNotes = false;
            } else if (line.startsWith('Customer Type:')) {
                data.type = line.substring('Customer Type:'.length).trim();
                capturingNotes = false;
            } else if (line.startsWith('Notes:')) {
                notesBuffer.push(line.substring('Notes:'.length).trim());
                capturingNotes = true;
            } else if (capturingNotes) {
                notesBuffer.push(line);
            }
        });
        data.notes = notesBuffer.join('\n').trim();
    } else {
        data.notes = notes.trim();
    }
    return data;
}

function populateCustomerFormForEdit(job) {
    customerViewTitle.textContent = "Update Customer Details";
    submitCustomerText.textContent = "Update";
    
    const parsedData = parseNotes(job.notes);

    customerStaffNameInput.value = job.staffName;
    customerNameInput.value = parsedData.name;
    customerMobileInput.value = parsedData.mobile;
    customerTypeInput.value = parsedData.type;
    customerNotesInput.value = parsedData.notes;

    customerServiceAreaInput.value = job.area;
    populateLandmarks(customerServiceAreaInput, customerLandmarkInput);
    customerLandmarkInput.value = job.landmark;
    
    customerLocationSearchInput.value = job.customerAddress;
    customerSelectedLocation = job.location;
    
    customerFilesToUpload = [];
    if (job.photoURLs && job.photoURLs.length > 0) {
        customerFilesToUpload.push(...job.photoURLs);
        renderPreviews(customerFilesToUpload, customerImagePreviewContainer);
    } else {
        customerImagePreviewContainer.innerHTML = '';
    }

    const checkMapReady = setInterval(() => {
        if (customerMap && customerSelectedLocation) {
            clearInterval(checkMapReady);
            google.maps.event.trigger(customerMap, 'resize');
            customerMap.setCenter(customerSelectedLocation);
            customerMap.setZoom(16);
            if (customerMarker) customerMarker.setMap(null);
            customerMarker = new google.maps.Marker({
                position: customerSelectedLocation,
                map: customerMap
            });
        }
    }, 100);
}

async function updateCustomerJob() {
    if (!validateCustomerForm() || !jobToEdit) return;
    
    setSubmitButtonLoading(true, 'customer');

    try {
        const newFilesToUpload = customerFilesToUpload.filter(item => typeof item !== 'string');
        const existingPhotoURLs = customerFilesToUpload.filter(item => typeof item === 'string');

        const uploadPromises = newFilesToUpload.map(file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
                .then(response => response.json())
                .then(data => data.secure_url);
        });
        const newPhotoURLs = await Promise.all(uploadPromises);
        const allPhotoURLs = [...existingPhotoURLs, ...newPhotoURLs];

        const notes = `Customer Name: ${customerNameInput.value.trim()}\nMobile Number: ${customerMobileInput.value.trim()}\nNotes: ${customerNotesInput.value.trim()}\nCustomer Type: ${customerTypeInput.value}`;

        const updatedData = {
            staffName: customerStaffNameInput.value,
            area: customerServiceAreaInput.value,
            landmark: customerLandmarkInput.value,
            customerAddress: customerLocationSearchInput.value,
            notes: notes,
            location: customerSelectedLocation,
            photoURLs: allPhotoURLs,
            lastUpdated: new Date()
        };

        const jobRef = doc(db, "jobs", jobToEdit);
        await updateDoc(jobRef, updatedData);

        const lang = localStorage.getItem('language') || 'en';
        showSuccess(translations[lang].updateSuccessMessage);
        
    } catch (error) {
        console.error("Error updating customer job:", error);
    } finally {
        setSubmitButtonLoading(false, 'customer');
    }
}

// --- Leave Management ---
function setSaveLeavesButtonLoading(isLoading) {
    saveLeavesBtn.disabled = isLoading;
    saveLeavesBtnText.classList.toggle('hidden', isLoading);
    saveLeavesBtnLoader.classList.toggle('hidden', !isLoading);
}

function formatDate(date) {
    // Returns YYYY-MM-DD
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

function renderLeaveCalendar() {
    leaveCalendarContainer.innerHTML = '';
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let calendarHtml = `
        <div class="flex justify-between items-center mb-4">
            <button id="prev-month-btn" class="px-2 py-1 rounded hover:bg-gray-200"><</button>
            <h3 class="font-bold text-lg">${monthNames[month]} ${year}</h3>
            <button id="next-month-btn" class="px-2 py-1 rounded hover:bg-gray-200">></button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-sm">
            <div class="font-semibold">Sun</div>
            <div class="font-semibold">Mon</div>
            <div class="font-semibold">Tue</div>
            <div class="font-semibold">Wed</div>
            <div class="font-semibold">Thu</div>
            <div class="font-semibold">Fri</div>
            <div class="font-semibold">Sat</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        calendarHtml += '<div></div>';
    }

    const today = new Date();
    const todayStr = formatDate(today);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(new Date(year, month, day));
        const isSelected = tempLeaveDates.includes(dateStr);
        const isToday = dateStr === todayStr;

        let classes = 'p-2 rounded-full cursor-pointer hover:bg-blue-100';
        if (isSelected) {
            classes += ' bg-red-500 text-white';
        } else if (isToday) {
            classes += ' bg-blue-200 font-bold';
        }
        calendarHtml += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    calendarHtml += `</div>`;
    leaveCalendarContainer.innerHTML = calendarHtml;

    document.getElementById('prev-month-btn').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderLeaveCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderLeaveCalendar();
    });

    leaveCalendarContainer.querySelectorAll('[data-date]').forEach(cell => {
        cell.addEventListener('click', (e) => {
            const dateStr = e.target.dataset.date;
            const index = tempLeaveDates.indexOf(dateStr);
            if (index > -1) {
                tempLeaveDates.splice(index, 1);
            } else {
                tempLeaveDates.push(dateStr);
            }
            tempLeaveDates.sort();
            e.target.classList.toggle('bg-red-500');
            e.target.classList.toggle('text-white');
        });
    });
}

async function handleSaveLeaves() {
    if (!staffForLeaveMgmt) return;
    setSaveLeavesButtonLoading(true);

    try {
        const staffRef = doc(db, "staffMembers", staffForLeaveMgmt.id);
        await updateDoc(staffRef, { leaves: tempLeaveDates });
        
        showSuccess(`Leaves updated for ${staffForLeaveMgmt.name}.`);
        leaveModal.classList.add('hidden');

    } catch(error) {
        console.error("Error updating leaves: ", error);
        alert("Failed to update leaves.");
    } finally {
        setSaveLeavesButtonLoading(false);
    }
}


function initializeEventListeners() {
    loginBtn.addEventListener('click', () => {
        signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(error => {
            loginError.textContent = "Failed to login. Check email and password.";
        });
    });

    setupLogoutButtons();
    
    langSwitcherStaff.addEventListener('change', (e) => setLanguage(e.target.value));

    // Staff View Listeners
    serviceAreaInput.addEventListener('change', () => populateLandmarks(serviceAreaInput, landmarkInput));
    cancelCameraBtn.addEventListener('click', stopCameraStream);
    cancelJobBtn.addEventListener('click', () => {
        if (isEditMode) {
            staffView.classList.add('hidden');
            adminContainer.classList.remove('hidden');
            dashboardView.classList.remove('hidden');
        }
        clearStaffForm();
    });
    imagePreviewContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-img-btn');
        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);
            if (!isNaN(index) && index < filesToUpload.length) {
                filesToUpload.splice(index, 1);
                renderPreviews(filesToUpload, imagePreviewContainer);
            }
        }
    });
    okBtn.addEventListener('click', () => {
        successModal.classList.add('hidden');
        if (isEditMode) {
            customerView.classList.add('hidden');
            staffView.classList.add('hidden');
            adminContainer.classList.remove('hidden');
            dashboardView.classList.remove('hidden');
            clearStaffForm();
            clearCustomerForm();
        } else if (customerView.classList.contains('hidden') && staffView.classList.contains('hidden') && !areaConfigModal.classList.contains('hidden')) {
            // Do nothing, just close the success modal over the config modal
        } else if (!customerView.classList.contains('hidden')) {
            customerView.classList.add('hidden');
            mapView.classList.remove('hidden');
            clearCustomerForm();
        } else {
            clearStaffForm();
        }
    });
    currentLocationBtn.addEventListener('click', () => {
        setCurrentLocationButtonLoading(true);
        navigator.geolocation.getCurrentPosition(pos => {
            const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            selectedLocation = location;
            document.getElementById('location-error').classList.add('hidden');
    
            staffMap.setCenter(location);
            staffMap.setZoom(15);
            if (staffMarker) staffMarker.setMap(null);
            staffMarker = new google.maps.Marker({ position: location, map: staffMap });
    
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'location': location }, (results, status) => {
                if (status === 'OK') {
                    if (results[0]) {
                        locationSearchInput.value = results[0].formatted_address;
                        junctionAddressInput.value = results[0].formatted_address;
                    }
                }
                setCurrentLocationButtonLoading(false);
            });
        }, (error) => {
            console.error("Error getting current location: ", error);
            setCurrentLocationButtonLoading(false);
        });
    });
    submitJobBtn.addEventListener('click', async () => {
        if (!validateForm()) return;

        if (isEditMode) {
            updateModal.classList.remove('hidden');
            return;
        }

        const user = auth.currentUser;
        setSubmitButtonLoading(true);
    
        if (!junctionAddressInput.value.trim() && locationSearchInput.value) {
            junctionAddressInput.value = locationSearchInput.value;
        }
    
        try {
            const uploadPromises = filesToUpload.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
                    .then(response => response.json())
                    .then(data => data.secure_url);
            });
            const photoURLs = await Promise.all(uploadPromises);
    
            await addDoc(collection(db, "jobs"), {
                staffName: staffNameInput.value,
                staffUid: user.uid, 
                category: jobTypeInput.value,
                area: serviceAreaInput.value, 
                landmark: landmarkInput.value,
                customerAddress: junctionAddressInput.value,
                notes: jobNotesInput.value, 
                location: selectedLocation,
                timestamp: new Date(), 
                photoURLs: photoURLs
            });

            filesToUpload = [];
            const lang = localStorage.getItem('language') || 'en';
            showSuccess(translations[lang].successMessage);
        } catch (error) { console.error("Error submitting job:", error);
        } finally { setSubmitButtonLoading(false); }
    });


    // Admin View Listeners
    searchInput.addEventListener('input', applyFiltersAndSort);
    areaFilterInput.addEventListener('change', () => {
        populateDashboardLandmarkFilter();
        applyFiltersAndSort();
    });
    landmarkFilterInput.addEventListener('change', applyFiltersAndSort);
    jobTypeFilterInput.addEventListener('change', applyFiltersAndSort);
    staffNameFilterInput.addEventListener('change', applyFiltersAndSort);
    dashboardPeriod.addEventListener('change', applyFiltersAndSort);
    dashboardStartDate.addEventListener('change', applyFiltersAndSort);
    dashboardEndDate.addEventListener('change', applyFiltersAndSort);
    
    mapAreaFilter.addEventListener('change', () => {
        populateMapLandmarkFilter();
        applyMapFilters();
    });
    mapLandmarkFilter.addEventListener('change', applyMapFilters);
    mapCustomerTypeFilter.addEventListener('change', applyMapFilters);
    mapSearchInput.addEventListener('input', applyMapFilters);

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        jobToDelete = null;
    });
    confirmDeleteBtn.addEventListener('click', handleDeleteJob);

    cancelUpdateBtn.addEventListener('click', () => {
        updateModal.classList.add('hidden');
    });
    confirmUpdateBtn.addEventListener('click', updateJob);
    
    manageStaffBtn.addEventListener('click', () => {
        dashboardView.classList.add('hidden');
        manageStaffView.classList.remove('hidden');
        calculateAndRenderStaffStats();
    });

    backToDashboardBtn3.addEventListener('click', () => {
        manageStaffView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
    });

    openAddStaffModalBtn.addEventListener('click', () => {
        staffToEditId = null;
        closeAndResetStaffModal();
        addStaffModal.classList.remove('hidden');
    });
    cancelAddStaffBtn.addEventListener('click', closeAndResetStaffModal);
    confirmAddStaffBtn.addEventListener('click', handleSaveStaff);

    staffStatsTableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-staff-btn');
        if (deleteBtn) {
            staffToDeleteId = deleteBtn.dataset.id;
            deleteStaffModal.classList.remove('hidden');
        }
        const editBtn = e.target.closest('.edit-staff-btn');
        if (editBtn) {
            staffToEditId = editBtn.dataset.id;
            const staffData = allStaff.find(s => s.id === staffToEditId);
            if (staffData) {
                addStaffModal.querySelector('h2').textContent = "Edit Staff Member";
                confirmAddStaffBtn.querySelector('span').textContent = "Update";
                newStaffNameInput.value = staffData.name;
                newStaffMobileInput.value = staffData.mobile || '';
                addStaffError.classList.add('hidden');
                addStaffModal.classList.remove('hidden');
            }
        }
        const leaveBtn = e.target.closest('.leave-calendar-btn');
        if(leaveBtn) {
            const staffId = leaveBtn.dataset.id;
            const staffName = leaveBtn.dataset.name;
            const staffMember = allStaff.find(s => s.id === staffId);

            staffForLeaveMgmt = { id: staffId, name: staffName };
            tempLeaveDates = [...(staffMember?.leaves || [])]; 
            
            leaveModalTitle.textContent = `Manage Leaves for ${staffName}`;
            calendarDate = new Date(); 
            renderLeaveCalendar();
            leaveModal.classList.remove('hidden');
        }
        const viewLeaveDatesBtn = e.target.closest('.view-leave-dates-btn');
        if (viewLeaveDatesBtn) {
            e.preventDefault();
            const staffName = viewLeaveDatesBtn.dataset.name;
            const datesStr = viewLeaveDatesBtn.dataset.dates;
            const dates = datesStr ? datesStr.split(',') : [];

            leaveDatesModalTitle.textContent = `Leaves for ${staffName}`;

            if (dates.length > 0) {
                const formattedDates = dates.map(dateStr => {
                    const date = new Date(dateStr + 'T00:00:00');
                    return date.toLocaleDateString('en-GB', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                });
                leaveDatesListContainer.innerHTML = `<ul class="list-disc list-inside space-y-1">${formattedDates.map(d => `<li>${d}</li>`).join('')}</ul>`;
            } else {
                leaveDatesListContainer.innerHTML = '<p class="text-gray-500">No leaves recorded in this period.</p>';
            }
            leaveDatesModal.classList.remove('hidden');
        }
    });

    cancelDeleteStaffBtn.addEventListener('click', () => {
        deleteStaffModal.classList.add('hidden');
        staffToDeleteId = null;
    });

    confirmDeleteStaffBtn.addEventListener('click', handleDeleteStaff);

    staffPerfPeriod.addEventListener('change', () => {
        staffPerfCustomDateRange.classList.toggle('hidden', staffPerfPeriod.value !== 'custom');
        calculateAndRenderStaffStats();
    });
    staffPerfStartDate.addEventListener('change', calculateAndRenderStaffStats);
    staffPerfEndDate.addEventListener('change', calculateAndRenderStaffStats);
    
    // LEAVE MODAL LISTENERS
    closeLeaveModalBtn.addEventListener('click', () => leaveModal.classList.add('hidden'));
    cancelLeavesBtn.addEventListener('click', () => leaveModal.classList.add('hidden'));
    saveLeavesBtn.addEventListener('click', handleSaveLeaves);
    closeLeaveDatesModalBtn.addEventListener('click', () => leaveDatesModal.classList.add('hidden'));
    okLeaveDatesBtn.addEventListener('click', () => leaveDatesModal.classList.add('hidden'));

    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sort;
            if (currentSort.key === sortKey) {
                currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.key = sortKey;
                currentSort.dir = (sortKey === 'timestamp' || sortKey === 'area' || sortKey === 'landmark') ? 'desc' : 'asc';
            }
            applyFiltersAndSort();
        });
    });
    viewMapBtn.addEventListener('click', () => {
        dashboardView.classList.add('hidden');
        mapView.classList.remove('hidden');
        if (!googleMap && window.google) {
            window.initMap();
        }
        renderMapMarkers(allJobs); 
    });
    
    trackCustomerBtn.addEventListener('click', () => {
        window.open('index.html?view=track_customer', '_blank');
    });

    viewAnalyticsBtn.addEventListener('click', () => {
        dashboardView.classList.add('hidden');
        analyticsView.classList.remove('hidden');
        initAnalyticsView();
    });
    backToDashboardBtn.addEventListener('click', (e) => {
        mapView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        window.history.pushState({}, document.title, "/index.html");
    });
    backToDashboardBtn2.addEventListener('click', () => {
        analyticsView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
    });
    closeImageModal.addEventListener('click', () => imageModal.classList.add('hidden'));
    nextImageBtn.addEventListener('click', () => showModalImage(currentModalImageIndex + 1));
    prevImageBtn.addEventListener('click', () => showModalImage(currentModalImageIndex - 1));
    downloadImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetch(e.currentTarget.href)
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `job-photo-${currentModalImageIndex + 1}.jpg`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            });
    });
    
    exportMenuBtn.addEventListener('click', () => {
        exportOptions.classList.toggle('hidden');
    });
    exportExcelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportToExcel(currentFilteredJobs);
        exportOptions.classList.add('hidden');
    });
    exportPdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportToPdf(currentFilteredJobs);
        exportOptions.classList.add('hidden');
    });

    // Analytics Listeners
    analyticsPeriod.addEventListener('change', renderAnalytics);
    analyticsAreaFilter.addEventListener('change', renderAnalytics);
    startDateInput.addEventListener('change', renderAnalytics);
    endDateInput.addEventListener('change', renderAnalytics);
    
    dashboardPeriod.addEventListener('change', () => {
        dashboardCustomDateRange.classList.toggle('hidden', dashboardPeriod.value !== 'custom');
        applyFiltersAndSort();
    });

    // CUSTOMER VIEW LISTENERS
    addCustomerBtn.addEventListener('click', () => {
        clearCustomerForm();
        isEditMode = false;
        mapView.classList.add('hidden');
        customerView.classList.remove('hidden');
        initCustomerView();
    });
    cancelCustomerBtn.addEventListener('click', () => {
        if(isEditMode) {
            customerView.classList.add('hidden');
            adminContainer.classList.remove('hidden');
            dashboardView.classList.remove('hidden');
        } else {
            customerView.classList.add('hidden');
            mapView.classList.remove('hidden');
        }
        clearCustomerForm();
    });
    customerServiceAreaInput.addEventListener('change', () => populateLandmarks(customerServiceAreaInput, customerLandmarkInput));
    customerImagePreviewContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-img-btn');
        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);
            if (!isNaN(index) && index < customerFilesToUpload.length) {
                customerFilesToUpload.splice(index, 1);
                renderPreviews(customerFilesToUpload, customerImagePreviewContainer);
            }
        }
    });
     customerCurrentLocationBtn.addEventListener('click', () => {
        setCurrentLocationButtonLoading(true, 'customer');
        navigator.geolocation.getCurrentPosition(pos => {
            const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            customerSelectedLocation = location;
            document.getElementById('customer-location-error').classList.add('hidden');
    
            customerMap.setCenter(location);
            customerMap.setZoom(15);
            if (customerMarker) customerMarker.setMap(null);
            customerMarker = new google.maps.Marker({ position: location, map: customerMap });
    
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'location': location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    customerLocationSearchInput.value = results[0].formatted_address;
                }
                setCurrentLocationButtonLoading(false, 'customer');
            });
        }, (error) => {
            console.error("Error getting current location: ", error);
            setCurrentLocationButtonLoading(false, 'customer');
        });
    });
    submitCustomerBtn.addEventListener('click', async () => {
        if (!validateCustomerForm()) return;
        if(isEditMode) {
            updateCustomerJob();
            return;
        }

        const user = auth.currentUser;
        if (!user) return;
        setSubmitButtonLoading(true, 'customer');

        const notes = `Customer Name: ${customerNameInput.value.trim()}\nMobile Number: ${customerMobileInput.value.trim()}\nNotes: ${customerNotesInput.value.trim()}\nCustomer Type: ${customerTypeInput.value}`;

        try {
            const uploadPromises = customerFilesToUpload.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
                    .then(response => response.json())
                    .then(data => data.secure_url);
            });
            const photoURLs = await Promise.all(uploadPromises);

            await addDoc(collection(db, "jobs"), {
                staffName: customerStaffNameInput.value,
                staffUid: user.uid, 
                category: "Installation",
                area: customerServiceAreaInput.value, 
                landmark: customerLandmarkInput.value,
                customerAddress: customerLocationSearchInput.value,
                notes: notes, 
                location: customerSelectedLocation,
                timestamp: new Date(), 
                photoURLs: photoURLs
            });
            
            showSuccess("New customer added successfully.");

        } catch (error) {
            console.error("Error submitting customer:", error);
        } finally {
            setSubmitButtonLoading(false, 'customer');
        }
    });

    // AREA CONFIGURATION LISTENERS
    configAreaBtn.addEventListener('click', () => {
        areaConfigModal.classList.remove('hidden');
    });
    closeAreaConfigModalBtn.addEventListener('click', () => areaConfigModal.classList.add('hidden'));
    addAreaBtn.addEventListener('click', handleAddServiceArea);
    saveAreaChangesBtn.addEventListener('click', handleSaveChanges);
    deleteAreaBtn.addEventListener('click', handleDeleteSelectedArea);

    areaConfigSelect.addEventListener('change', () => {
        const selectedId = areaConfigSelect.value;
        if (selectedId) {
            selectedAreaForEditing = allServiceAreas.find(a => a.id === selectedId);
            editedLandmarks = [...selectedAreaForEditing.landmarks]; // Create a copy for editing
            renderLandmarkEditor();
            landmarkEditorContainer.classList.remove('hidden');
        } else {
            selectedAreaForEditing = null;
            editedLandmarks = [];
            landmarkEditorContainer.classList.add('hidden');
        }
    });

    addLandmarkBtn.addEventListener('click', () => {
        const newName = newLandmarkInput.value.trim();
        if(!newName) return;
        if(editedLandmarks.some(l => l.toLowerCase() === newName.toLowerCase())) {
            alert("This landmark already exists.");
            return;
        }
        editedLandmarks.push(newName);
        newLandmarkInput.value = '';
        renderLandmarkEditor();
    });

    landmarkListEditor.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-landmark-btn');
        if (deleteBtn) {
            const landmarkName = deleteBtn.dataset.landmarkName;
            if (confirm(`Are you sure you want to remove the landmark "${landmarkName}"? This change will be temporary until you save.`)) {
                editedLandmarks = editedLandmarks.filter(l => l !== landmarkName);
                renderLandmarkEditor();
            }
        }
    });

}

initializeEventListeners();