# Voice Agent Update Summary

## Changes Made

Successfully updated the voice agent system from logistics tracking to medical consultation platform.

## 1. Agent Types Updated

**Previous Agents (3):**
- Fahad Abdullah - Order Tracking Specialist
- Fatima Zahra - Customer Success Manager
- Hammad Mohammed - Scheduling Coordinator

**New Agents (7):**
- **DR. Pooja** - ALLERGY & IMMUNOLOGY SPECIALIST
- **DR. Khushboo** - DERMATOLOGIST SPECIALIST
- **DR. Arpita** - GENERAL PHYSICIAN SPECIALIST
- **DR. Pratiksha** - NEUROLOGY SPECIALIST
- **DR. Parthvi** - UROLOGY SPECIALIST
- **DR. Anjali** - PHYSICAL THERAPIST SPECIALIST
- **DR. Rekha** - CARDIOVASCULAR SPECIALIST

## 2. Form Implementation

### Previous Behavior:
- Only "Fahad Abdullah" (tracking agent) showed a form
- Form collected: Phone Number and Order ID

### New Behavior:
- **ALL agents now show a patient information form**
- Form collects:
  - **Patient Name** (Your Name)
  - **Contact Number** (Phone Number)

### Form UI:
- Same elegant UI design as before
- Modal appears when clicking "Call Agent" on any doctor
- Patient icon header
- Shows which doctor the patient is connecting with
- Validates both fields before allowing "Start Call"

## 3. Data Format Sent to Pipecat Backend

The following data is sent as query parameters to the backend:

```json
{
  "voiceAgentName": "ALLERGY",  // or DERMATOLOGIST, CARDIOVASCULAR, etc.
  "voiceName": "pooja",
  "name": "jay",                 // User's name from form
  "phoneNumber": "+918200292304" // User's phone number from form
}
```

### voiceAgentName Options:
- `ALLERGY`
- `DERMATOLOGIST`
- `GENERAL_PHYSICIAN`
- `NEUROLOGY`
- `UROLOGY`
- `PHYSICAL_THERAPIST`
- `CARDIOVASCULAR`

## 4. Files Modified

1. **`types.ts`**
   - Updated `AgentType` enum with 7 new medical specialties
   - Changed `AgentProfile` interface to use `userName` instead of `orderId`

2. **`constants.ts`**
   - Replaced all 3 logistics agents with 7 doctors
   - Updated all agent profiles with medical specializations
   - All agents use `voiceName: 'pooja'` as specified

3. **`components/VoiceWidget.tsx`**
   - Changed form to show for ALL agents, not just tracking
   - Updated form fields: Name + Phone Number (removed Order ID)
   - Renamed state variables from `trackingData` to `patientData`
   - Updated modal title and description for medical context

4. **`hooks/usePipecatConnection.ts`**
   - Updated connect function to send new data format
   - Removed `systemInstruction` and `orderId` from query params
   - Added `name` (from `userName`) to query params
   - Simplified to match required backend format

## 5. Backend Integration

The backend should expect these query parameters in the `/api/connect` endpoint:
- `voiceAgentName` - Agent specialty type
- `voiceName` - Voice to use (currently "pooja" for all)
- `name` - Patient's name from form
- `phoneNumber` - Patient's contact number from form

## Next Steps

The frontend is ready! The backend should:
1. Extract query parameters from the request
2. Format them according to Pipecat Cloud's requirements
3. Initialize the voice session with the patient data
