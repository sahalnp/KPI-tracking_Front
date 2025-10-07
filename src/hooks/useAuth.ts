import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface UserState {
    user: any; 
    isAuthenticated: boolean;
}

export const UserAuth = (): UserState => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.user);
    return { user, isAuthenticated };
};
