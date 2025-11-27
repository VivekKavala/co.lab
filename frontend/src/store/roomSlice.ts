import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface RoomState {
  roomId: string | null;
  code: string;
  isConnected: boolean;
}

const initialState: RoomState = {
  roomId: null,
  code: "",
  isConnected: false,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },
    setIsConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setRoomId, setCode, setIsConnected } = roomSlice.actions;
export default roomSlice.reducer;
