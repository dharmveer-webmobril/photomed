
import imagePaths from "../assets/images";
import Grid33 from "../assets/SvgIcons/Grid33";
import Grid44 from "../assets/SvgIcons/Grid44";
import GridBorder from "../assets/SvgIcons/GridBorder";
import FrontFace from "../assets/SvgIcons/Face/FrontFace";
import LeftFace from "../assets/SvgIcons/Face/LeftFace";
import FrontNeck from "../assets/SvgIcons/Neck/FrontNeck";
import LeftNeck from "../assets/SvgIcons/Neck/LeftNeck";
import BackTrio from "../assets/SvgIcons/Trichology/BackTrio";
import SlightLeft from "../assets/SvgIcons/Face/SlightLeft";
import SlightRight from "../assets/SvgIcons/Face/SlightRight";
import RightFace from "../assets/SvgIcons/Face/RightFace";
import Lip from "../assets/SvgIcons/Face/Lip";
import LeftNeckDown from "../assets/SvgIcons/Neck/LeftNeckDown";
import RightNeck from "../assets/SvgIcons/Neck/RightNeck";
import RightNeckDown from "../assets/SvgIcons/Neck/RightNeckDown";
import FrontTrio from "../assets/SvgIcons/Trichology/FrontTrio";
import SlightLeftTrio from "../assets/SvgIcons/Trichology/SlightLeftTrio";
import LeftTrio from "../assets/SvgIcons/Trichology/LeftTrio";
import SlightRightTrio from "../assets/SvgIcons/Trichology/SlightRightTrio";
import RightTrio from "../assets/SvgIcons/Trichology/RightTrio";
import LeftBody from "../assets/SvgIcons/body/LeftBody";
import ColordBody from "../assets/SvgIcons/body/ColordBody";
import RightBody from "../assets/SvgIcons/body/RightBody";
import BackBody from "../assets/SvgIcons/body/BackBody";
import SlightLeftBody from "../assets/SvgIcons/body/SlightLeftBody";
import SlightRightBody from "../assets/SvgIcons/body/SlightRightBody";

const gridData = [
    { id: 1, icon: Grid33, message: "Grid 3x3" },
    { id: 2, icon: Grid44, message: "Grid 4x4" },
    { id: 3, icon: GridBorder, message: "No Grid" },
];


export const bodyData = [
    {
        id: 1,
        icon: ColordBody,
        image: imagePaths.body_front,
        message: "Frontal body",
        align: "center",
    },
    {
        id: 2,
        icon: LeftBody,
        image: imagePaths.body_left,
        message: "Left body",
        align: "center",
    },
    {
        id: 3,
        icon: SlightLeftBody,
        image: imagePaths.body_slight_left,
        message: "Partially left body",
        align: "center",
    },
    {
        id: 4,
        icon: SlightRightBody,
        image: imagePaths.body_slight_right,
        message: "Partially right body",
        align: "center",
    },
    {
        id: 5,
        icon: RightBody,
        image: imagePaths.body_right,
        message: "Right body",
        align: "center",
    },
    {
        id: 6,
        icon: BackBody,
        image: imagePaths.body_back,
        message: "Back body",
        align: "center",
    },
];

export const trichologyData = [
    {
        id: 1,
        icon: FrontTrio,
        image: imagePaths.scalp_top,
        message: "Parietal scalp",
        align: "center",
    },
    {
        id: 2,
        icon: BackTrio,
        image: imagePaths.scalp_top1,
        message: "Occipital scalp",
        align: "center",
    },
    {
        id: 3,
        icon: LeftTrio,
        image: imagePaths.scalp_left,
        message: "Left temporal scalp",
        align: "flex-start",
    },
    {
        id: 4,
        icon: SlightLeftTrio,
        image: imagePaths.scalp_slight_left,
        message: "Left 45 deg scalp",
        align: "flex-start",
    },
    {
        id: 5,
        icon: SlightRightTrio,
        image: imagePaths.scalp_right,
        message: "Right 45 deg scalp",
        align: "flex-end",
    },
    {
        id: 6,
        icon: RightTrio,
        image: imagePaths.scalp_slight_right,
        message: "Left temporal scalp",
        align: "flex-start",
    },
];

export const neckData = [
    {
        id: 1,
        icon: FrontNeck,
        image: imagePaths.neck_front,
        message: "Frontal neck",
        align: "center",
    },
    {
        id: 2,
        icon: LeftNeck,
        image: imagePaths.neck_left,
        message: "Left neck",
        align: "flex-start",
    },
    {
        id: 4,
        icon: LeftNeckDown,
        image: imagePaths.neck_down_left,
        message: "Left neck down",
        align: "flex-start",
    },
    {
        id: 5,
        icon: RightNeck,
        image: imagePaths.neck_right,
        message: "Right neck",
        align: "flex-end",
    },
    {
        id: 6,
        icon: RightNeckDown,
        image: imagePaths.neck_down_right,
        message: "Right neck down",
        align: "flex-end",
    },
];

export const faceData = [
    {
        id: 1,
        icon: FrontFace,
        image: imagePaths.face_front,
        message: "Frontal face",
        align: "center",
    },
    {
        id: 2,
        icon: LeftFace,
        image: imagePaths.face_left,
        message: "Left face",
        align: "flex-start",
    },
    {
        id: 3,
        icon: SlightLeft,
        image: imagePaths.face_slight_left,
        message: "Left face 45 deg",
        align: "flex-start",
    },
    {
        id: 4,
        icon: SlightRight,
        image: imagePaths.face_slight_right,
        message: "Right face 45 deg",
        align: "flex-end",
    },
    {
        id: 5,
        icon: RightFace,
        image: imagePaths.face_right,
        message: "Right face",
        align: "flex-end",
    },
    {
        id: 6,
        icon: Lip,
        image: imagePaths.face_lips,
        message: "Lips",
        align: "center",
    },
];

// Combine categories and their respective data into a single array
export const combinedData = [
    { id: 1, name: "Grid", data: gridData },
    { id: 2, name: "Face", data: faceData },
    { id: 3, name: "Neck", data: neckData },
    { id: 4, name: "Trichology", data: trichologyData },
    { id: 5, name: "Body", data: bodyData },
    // { id: 7, name: "Dermatoscopy", data: [] },
    { id: 6, name: "Ghost Photo", data: [] },
];
