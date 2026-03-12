import React from 'react';
import { Building2, MapPin, Phone, FileText } from 'lucide-react';

const INSTITUTE = {
  registeredName: 'A S upskill academy',
  gstNumber: '27ACCFA9428L1Z1',
  address: '203, Roongta Business Centre, Old Canal Link Rd, behind SBI Bank, Radha Vasudev Batavia Nagar, Govind Nagar, Nashik, Maharashtra 422009',
  contact: '+91 88309 44055',
};

/**
 * Institute footer – at bottom of page content. Visible to students only when they scroll down.
 */
const InstituteFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span>{INSTITUTE.registeredName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>GST: {INSTITUTE.gstNumber}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[280px] sm:max-w-none">{INSTITUTE.address}</span>
            </span>
            <a
              href={`tel:${INSTITUTE.contact.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{INSTITUTE.contact}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default InstituteFooter;
