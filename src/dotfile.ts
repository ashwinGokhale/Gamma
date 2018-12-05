export interface IDotfile {
	bases?: {
		[x: string]: {
			repos: {
				[x: string]: {
					base: string;
					path: string;
				};
			};
		};
	};
	context?: {
		base: string;
		repo: {
			name?: string;
			path?: string;
		};
	};
}
