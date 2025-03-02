import mongoose, { ObjectId, Schema, Document } from 'mongoose';

export interface IAgent extends Document {
    _id: ObjectId;
    storeId: ObjectId;
    IPAddress: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const agentSchema = new Schema<IAgent>(
    {
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
        IPAddress: { type: String, required: true, trim: true },
        country: { type: String, required: true },
        countryCode: { type: String, required: true },
        region: { type: String, required: true },
        regionName: { type: String, required: true },
        city: { type: String, required: true },
        zip: { type: String, required: true },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        timezone: { type: String, required: true },
        isp: { type: String, required: true },
        org: { type: String, required: true },
    },
    { timestamps: true }
);

export const AgentModel = mongoose.model<IAgent>('Agent', agentSchema);
