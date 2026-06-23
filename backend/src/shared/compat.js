/**
 * Recursively maps standardized prisma IDs to the legacy custom ID fields
 * expected by the React frontend (e.g. doctorId, adminId, medId, cancerId, reportId).
 */
export function mapCompat(data) {
  if (data === null || data === undefined) return data;
  
  if (Array.isArray(data)) {
    return data.map(mapCompat);
  }
  
  if (typeof data === 'object') {
    // Clone the object to avoid mutating the original prisma model
    const clone = { ...data };
    
    // Recurse into nested properties
    for (const key in clone) {
      if (clone[key] && (typeof clone[key] === 'object' || Array.isArray(clone[key]))) {
        clone[key] = mapCompat(clone[key]);
      }
    }
    
    // Add legacy compatibility ID mappings
    if (clone.id) {
      // 1. Doctor mapping
      if ('specialist' in clone || 'experience' in clone || 'rating' in clone) {
        clone.doctorId = clone.id;
      }
      
      // 2. Admin mapping (specifically roles other than PATIENT/DOCTOR)
      if (('username' in clone && 'role' in clone && clone.role !== 'PATIENT' && clone.role !== 'DOCTOR') || 'pharmacyName' in clone) {
        clone.adminId = clone.id;
      }
      
      // 3. Medicine mapping
      if ('medName' in clone && 'dose' in clone) {
        clone.medId = clone.id;
      }
      
      // 4. CancerType mapping
      if ('stage' in clone && 'treatments' in clone) {
        clone.cancerId = clone.id;
      }
      
      // 5. Report mapping
      if ('reportName' in clone && 'reportUrl' in clone) {
        clone.reportId = clone.id;
      }
    }

    // 6. User / Patient dashboard compatibility (lowercase relation fields -> legacy uppercase)
    if ('appointments' in clone) {
      clone.Appointments = clone.appointments;
    }
    if ('reports' in clone) {
      clone.Reports = clone.reports;
    }
    if ('cancerType' in clone) {
      clone.CancerType = clone.cancerType;
    }
    if (clone._count) {
      if ('appointments' in clone._count) {
        clone._count.Appointments = clone._count.appointments;
      }
    }

    // 7. RefillOrder compatibility
    if (clone.pharmacy && clone.pharmacy.name && !clone.pharmacyName) {
      clone.pharmacyName = clone.pharmacy.name;
    }
    
    return clone;
  }
  
  return data;
}
