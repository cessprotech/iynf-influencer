import { Model, PaginateOptions, PipelineStage, PopulateOptions } from "mongoose";
import { CustomPopulateOptions } from "./helpers";

const lookups = {
    user: {
        from: 'users',
        localField: 'userId',
        foreignField: 'userId',
    },
    
    creator: {
        from: 'creators',
        localField: 'creatorId',
        foreignField: 'creatorId',
    },
    
    job: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: 'jobId',
    },
    
    jobsCompleted: {
        from: 'jobs',
        localField: 'influencerId',
        foreignField: 'influencerId',
        pipeline: [
            {
                $match: { completed: true }
            }
        ],
        count: true,
    },
}

export const AggregateQueryMethods = {
    filter(data: Record<string, any>) {
        let updatedData: Record<string, any> = {};
        if (Object.keys(data).length !== 0) {
            const queryObj = { ...data };
            const excludeObj = ['page', 'sort', 'limit', 'select', 'search'];

            // REMOVE THE KEYS IN excludeObj from queryObj
            excludeObj.forEach((el) => delete queryObj[el]);

            // CHANGE (lt, gt, lte, gte) to ($lt, $gt, $lte, $gte)
            let stringObj = JSON.stringify(queryObj);

            stringObj = stringObj.replace(
                /\b(gt|lt|lte|gte|ne|eq|in)\b/g,
                (match) => `$${match}`
            );

            updatedData = JSON.parse(stringObj) as Record<string, any>;

            // updatedData = queryObj;
        }

        return updatedData;
    },

    sort(data: string | object = '') {
        // sort='price,age,-name' - Query
        
        const sort: Record<string, any> = {};

        if (data && typeof data === 'string') {
            let split = data.split(',');
            split.forEach((field: string) => {
                if (field.startsWith('-'))  sort[field.split('-')[1]] = -1;
                else sort[field] = 1
            });
        }

        sort["createdAt"] = -1;

        return sort;
    },

    populate(populateOptions: CustomPopulateOptions) {
        // POPULATION
        const pipeline = [];
        if (populateOptions === undefined) return pipeline;

        const lookupField = lookups[populateOptions?.path];


        if (lookupField) {
            const projection: Record<string, any> = {}

            if (populateOptions.select) {
                populateOptions.select.forEach((project: string) => {
                    projection[project] = 1;
                });
            }

            populateOptions.as = populateOptions.as || populateOptions.path;

            pipeline.push({
                $lookup: {
                    from: lookupField.from,
                    localField: lookupField.localField,
                    foreignField: lookupField.foreignField,
                    pipeline: [
                        ...(Object.keys(projection).length > 0) ? [{ $project: projection }] : [],
                        { $match: populateOptions.match || {} },
                        ...(Array.isArray(lookupField.pipeline) ? lookupField.pipeline : [])
                    ],
                    as: populateOptions.as
                }
            })

            if (lookupField.count) {
                pipeline.push({ $addFields: {[`${populateOptions.as}`]: { $size: `$${populateOptions.as}`}}})
            }
            else {
                const unwindType = (populateOptions.unwindType !== undefined) ? populateOptions.unwindType : 0;

            if (unwindType === 1 || unwindType === 2) {
                pipeline.push({
                    $unwind: { path: `$${populateOptions.as}`, preserveNullAndEmptyArrays: true }
                });

                if (populateOptions.sortPopulate) {
                    const sort = AggregateQueryMethods.sort(populateOptions.sortPopulate);

                    pipeline.push({
                        $sort: sort
                    })
                }

                if (unwindType === 2) {
                    const addedFields = {};

                    if (populateOptions.select) {
                        populateOptions.select.forEach((project: string) => {
                            addedFields[project] = `$${populateOptions.as}.${project}`;
                        });
                    }
    
                    pipeline.push({
                        $addFields: addedFields
                    })
                    
                    pipeline.push({
                        $project: {
                            [`${populateOptions.as}`]: 0
                        }
                    })
                }
            }
            }
        }

        return pipeline;
        
    },

    paginate(page: number = 1, limit: number = 10) {
        return [
              {
                $skip: (+page - 1) * +limit // Skip documents based on the page number and page size
              },
              {
                $limit: +limit // Limit the number of documents per page
              },
        ]
    }
};

export async function customPaginate<T>(model: Model<T>, pipeline: PipelineStage[], query: Record<string, any>, paginateOptions: PaginateOptions) {
    
    const data = await model.aggregate(pipeline);

    const countPipeline: PipelineStage[] = [{ $match: { ...query } }];
    const totalCount = await model.aggregate(countPipeline).count("count").exec();
    const totalData = totalCount.length > 0 ? totalCount[0].count : 0;

    return {
        docs: data,
        totalDocs: totalData,
        limit: paginateOptions.limit,
        totalPages: Math.ceil(totalData / (paginateOptions.limit)),
        page: paginateOptions.page,
        pagingCounter: (paginateOptions.page - 1) * (paginateOptions.limit) + 1,
        hasPrevPage: (paginateOptions.page) > 1,
        hasNextPage: (paginateOptions.page) < Math.ceil(totalData / (paginateOptions.limit)),
        prevPage: (paginateOptions.page) > 1 ? (paginateOptions.page) - 1 : null,
        nextPage: (paginateOptions.page) < Math.ceil(totalData / (paginateOptions.limit)) ? paginateOptions.page + 1 : null
    };
}