// Original clip IDs keep this order stable even if titles are edited.
export const preferredVideoIds = ["648520246ed0d8025afbbff1", "024b7445f13537088f250e18", "db5af260e06aaefb38210672", "fe41e2c63e71b05cc8cf01c7", "014c72946b8cc0a94b31ec06", "826b155da1e54ead5e645d09", "bb5d6ad2fc62ab1833904571", "cabeb5c55de6d4fcbfa1568c", "86c2b0171de0e927f5c5cae2", "81d5d1bca035e6a496e18e7b", "b56653526e7eb6dd3d4036ab", "c885856db3d74778b595cc03", "8f8e1a5861a117f074c12992", "4e2ee3b208c7400d61ebe3ed", "d51e159a2d65ec505bf9967f", "342eb5eb9283f5a60b09f8b8", "fbe166d217b1fac03b1e61e3", "9fd205f2eb5db2682de60213", "8190efff8cab4aceb177e8fa", "7fd5b182b595a70847b316fa", "7ac9048aea4a384e7c4c7e9c", "66e191c9ae96bc147d5ac164", "0f4140ee9bd70ea6b01dca7c"];
export function orderMemoryVideos(videos=[]) {
 const rank=new Map(preferredVideoIds.map((id,i)=>[id,i]));
 return videos.map((video,index)=>({video,index})).sort((a,b)=>(rank.get(a.video.mediaId)??rank.size)-(rank.get(b.video.mediaId)??rank.size)||a.index-b.index).map(item=>item.video);
}
