import { combineReducers } from 'redux';
import authReducer from './authReducer';
import imageReducer from './imageReducer';
import pdfReducer from './pdfReducer';
import themeReducer from './themeReducer';
import audioReducer from './audioReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  image: imageReducer,
  pdf: pdfReducer,
  theme: themeReducer,
  audio: audioReducer,
});

export default rootReducer;

