import nodemailer from 'nodemailer';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

// Template directory path
const TEMPLATE_DIR = path.join(__dirname, '../templates/emails');

// Email templates
export enum EmailTemplate {
  WELCOME = 'welcome.html',
  DELIVERY_CONFIRMATION = 'delivery-confirmation.html',
  DELIVERY_STATUS = 'delivery-status.html',
  DRIVER_ASSIGNED = 'driver-assigned.html',
  DELIVERY_COMPLETE = 'delivery-complete.html',
}

/**
 * Create a nodemailer transporter with environment configuration
 * For development, we use Ethereal (fake SMTP service)
 * For production, configure a real SMTP service
 */
const createTransporter = async () => {
  // For development/testing, use Ethereal (fake emails)
  if (process.env.NODE_ENV !== 'production') {
    // Create a test account on ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    // Log the test account URL for viewing emails
    console.log('Ethereal Email URL for viewing test emails:', nodemailer.getTestMessageUrl);
    
    // Create a SMTP transporter using ethereal.email
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  // For production, use your configured SMTP service
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

/**
 * Load and compile a Handlebars template
 */
const loadTemplate = async (templateName: string) => {
  try {
    const filePath = path.join(TEMPLATE_DIR, templateName);
    const templateSource = await fs.readFile(filePath, 'utf8');
    return Handlebars.compile(templateSource);
  } catch (error) {
    console.error(`Error loading template: ${templateName}`, error);
    throw error;
  }
};

/**
 * Send an email using a template
 */
export const sendTemplateEmail = async ({
  to,
  subject,
  templateName,
  data,
  from = process.env.EMAIL_FROM || 'Furniture Delivery <no-reply@furnituredelivery.co.za>',
}: {
  to: string | string[];
  subject: string;
  templateName: EmailTemplate;
  data: Record<string, any>;
  from?: string;
}) => {
  try {
    // Add current year to all templates for copyright
    data.year = new Date().getFullYear();
    
    // Create the transport
    const transporter = await createTransporter();
    
    // Load and compile the template
    const template = await loadTemplate(templateName);
    
    // Render the HTML with the data
    const html = template(data);
    
    // Send the email
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ''), // Simple HTML to text conversion
    });
    
    // For development, log the URL where the sent email can be viewed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email to a new user
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  dashboardUrl: string
) => {
  return sendTemplateEmail({
    to: email,
    subject: 'Welcome to Furniture Delivery!',
    templateName: EmailTemplate.WELCOME,
    data: {
      firstName,
      lastName,
      dashboardUrl,
      facebookUrl: 'https://facebook.com/furnituredelivery',
      twitterUrl: 'https://twitter.com/furnituredelivery',
      instagramUrl: 'https://instagram.com/furnituredelivery',
      linkedinUrl: 'https://linkedin.com/company/furnituredelivery',
      privacyPolicyUrl: 'https://furnituredelivery.co.za/privacy',
      termsUrl: 'https://furnituredelivery.co.za/terms',
      unsubscribeUrl: 'https://furnituredelivery.co.za/unsubscribe',
    },
  });
};

/**
 * Send delivery confirmation email
 */
export const sendDeliveryConfirmationEmail = async (
  email: string,
  customerName: string,
  deliveryId: string,
  scheduledDate: string,
  timeWindow: string,
  pickupAddress: string,
  deliveryAddress: string,
  totalAmount: string,
  paymentStatus: string,
  items: Array<{ name: string; quantity: number; specialHandling: string }>,
  trackingUrl: string
) => {
  return sendTemplateEmail({
    to: email,
    subject: `Your Furniture Delivery #${deliveryId} is Confirmed`,
    templateName: EmailTemplate.DELIVERY_CONFIRMATION,
    data: {
      customerName,
      deliveryId,
      scheduledDate,
      timeWindow,
      pickupAddress,
      deliveryAddress,
      totalAmount,
      paymentStatus,
      items,
      trackingUrl,
      privacyPolicyUrl: 'https://furnituredelivery.co.za/privacy',
      termsUrl: 'https://furnituredelivery.co.za/terms',
      unsubscribeUrl: 'https://furnituredelivery.co.za/unsubscribe',
    },
  });
};

/**
 * Send driver assignment email
 */
export const sendDriverAssignedEmail = async (
  email: string,
  customerName: string,
  deliveryId: string,
  driverName: string,
  driverInitials: string,
  driverPhone: string,
  vehicleType: string,
  vehicleColor: string,
  vehicleMake: string,
  vehicleModel: string,
  licensePlate: string,
  scheduledDate: string,
  timeWindow: string,
  pickupAddress: string,
  deliveryAddress: string,
  trackingUrl: string,
  ratingCount: number,
  averageRating: number
) => {
  // Calculate star ratings (simple implementation)
  const rating = Math.round(averageRating);
  const starRating = Array(rating).fill('★');
  const emptyStars = Array(5 - rating).fill('☆');
  
  return sendTemplateEmail({
    to: email,
    subject: `Driver Assigned to Your Furniture Delivery #${deliveryId}`,
    templateName: EmailTemplate.DRIVER_ASSIGNED,
    data: {
      customerName,
      deliveryId,
      driverName,
      driverInitials,
      driverPhone,
      vehicleType,
      vehicleColor,
      vehicleMake,
      vehicleModel,
      licensePlate,
      scheduledDate,
      timeWindow,
      pickupAddress,
      deliveryAddress,
      trackingUrl,
      starRating,
      emptyStars,
      ratingCount,
      privacyPolicyUrl: 'https://furnituredelivery.co.za/privacy',
      termsUrl: 'https://furnituredelivery.co.za/terms',
      unsubscribeUrl: 'https://furnituredelivery.co.za/unsubscribe',
    },
  });
};

/**
 * Send delivery status update email
 */
export const sendDeliveryStatusEmail = async (
  email: string,
  customerName: string,
  deliveryId: string,
  status: string,
  statusDescription: string,
  updateTime: string,
  trackingUrl: string,
  statusColor: string,
  estimatedDeliveryTime: string,
  driverInfo?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleColor: string;
    vehicleMake: string;
    vehicleModel: string;
    licensePlate: string;
  }
) => {
  // Determine status steps for progress bar
  const statusSteps = {
    'CONFIRMED': { step1Active: true },
    'PROCESSING': { step1Completed: true, step2Active: true },
    'DRIVER_ASSIGNED': { step1Completed: true, step2Completed: true, step3Active: true },
    'IN_TRANSIT': { step1Completed: true, step2Completed: true, step3Completed: true, step4Active: true },
    'DELIVERED': { step1Completed: true, step2Completed: true, step3Completed: true, step4Completed: true, step5Active: true },
    'COMPLETED': { step1Completed: true, step2Completed: true, step3Completed: true, step4Completed: true, step5Completed: true },
  };
  
  // Flag to indicate if driver is assigned
  const driverAssigned = status === 'DRIVER_ASSIGNED' || status === 'IN_TRANSIT' || status === 'DELIVERED' || status === 'COMPLETED';
  
  // Flag to indicate if delivery is in transit
  const inTransit = status === 'IN_TRANSIT';
  
  return sendTemplateEmail({
    to: email,
    subject: `Update on Your Furniture Delivery #${deliveryId}`,
    templateName: EmailTemplate.DELIVERY_STATUS,
    data: {
      customerName,
      deliveryId,
      statusName: status.replace('_', ' '),
      statusDescription,
      updateTime,
      trackingUrl,
      statusColor,
      estimatedDeliveryTime,
      driverAssigned,
      inTransit,
      driverName: driverInfo?.name,
      driverPhone: driverInfo?.phone,
      vehicleType: driverInfo?.vehicleType,
      vehicleColor: driverInfo?.vehicleColor,
      vehicleMake: driverInfo?.vehicleMake,
      vehicleModel: driverInfo?.vehicleModel,
      licensePlate: driverInfo?.licensePlate,
      ...statusSteps[status as keyof typeof statusSteps],
      privacyPolicyUrl: 'https://furnituredelivery.co.za/privacy',
      termsUrl: 'https://furnituredelivery.co.za/terms',
      unsubscribeUrl: 'https://furnituredelivery.co.za/unsubscribe',
    },
  });
};

/**
 * Send delivery completion email
 */
export const sendDeliveryCompleteEmail = async (
  email: string,
  customerName: string,
  deliveryId: string,
  deliveryDate: string,
  deliveryTime: string,
  deliveryAddress: string,
  itemCount: number,
  driverName: string,
  ratingUrl: string,
  feedbackUrl: string
) => {
  return sendTemplateEmail({
    to: email,
    subject: `Your Furniture Delivery #${deliveryId} is Complete - We'd Love Your Feedback`,
    templateName: EmailTemplate.DELIVERY_COMPLETE,
    data: {
      customerName,
      deliveryId,
      deliveryDate,
      deliveryTime,
      deliveryAddress,
      itemCount,
      driverName,
      ratingUrl,
      feedbackUrl,
      privacyPolicyUrl: 'https://furnituredelivery.co.za/privacy',
      termsUrl: 'https://furnituredelivery.co.za/terms',
      unsubscribeUrl: 'https://furnituredelivery.co.za/unsubscribe',
    },
  });
};