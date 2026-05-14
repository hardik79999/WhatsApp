import { Icon } from './Icons';

// Clock icon for pending/sending state
const ClockIcon = () => (
  <svg viewBox="0 0 16 15" fill="currentColor" width="14" height="14" style={{ opacity: 0.6 }}>
    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 4v4.25l3.5 2.08-.58 1-4.17-2.5V4h1.25z"/>
  </svg>
);

function MessageTicks({ status }) {
  if (status === 'read') {
    // Blue double ticks
    return <span style={{ color: '#53bdeb', display: 'flex' }}><Icon.CheckDouble /></span>;
  }
  if (status === 'delivered') {
    // Grey double ticks
    return <span style={{ color: '#8696a0', display: 'flex' }}><Icon.CheckDouble /></span>;
  }
  if (status === 'sent') {
    // Grey single tick
    return <span style={{ color: '#8696a0', display: 'flex' }}><Icon.CheckSingle /></span>;
  }
  // Pending / sending — clock icon
  return <span style={{ color: '#8696a0', display: 'flex' }}><ClockIcon /></span>;
}

export default MessageTicks;
