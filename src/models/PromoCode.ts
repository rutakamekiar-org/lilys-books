export enum PromoCodeType {
    Fixed = 0,
    Percentage = 1
}

export interface PromoCodeResponse {
    code: string | null;
    type: PromoCodeType;
    value: number;
    applicableProductItemIds: string[] | null;
}
